const { fn, col, literal, Op } = require('sequelize');

const DashboardRepository = require('../repositories/dashboard.repository');

const { Patient, Appointment, Diagnosis, Treatment } = require('../models/index');
const ValidationError = require('../errors/ValidationError');

const { throwIfNotExists } = require('../utils/error-utils');

const sequelize = require('../config/database');

// Map config → Sequelize model
const ENTITY_MAP = {
    Patient,
    Appointment,
    Diagnosis,
    Treatment,
};

// ===== DASHBOARD =====

/**
 * Retrieves and resolves the dashboard for a user.
 *
 * Workflow:
 * - Fetch dashboard with components
 * - Validate existence
 * - Resolve each component (execute dynamic queries)
 *
 * @param {number} userId
 * @returns {Promise<{id: number, components: Array}>}
 */
async function getDashboard(userId) {
    const dashboard = await DashboardRepository.findByUserId(userId);

    const resolvedDashboard = throwIfNotExists(dashboard, 'dashboard', { userId });

    const resolvedComponents = await Promise.all(resolvedDashboard.components.map((c) => resolveComponent(c, userId)));
    return {
        id: resolvedDashboard.id,
        components: resolvedComponents,
    };
}

/**
 * Updates the layout of a dashboard
 *
 * Workflow:
 * - Fetch dashboard with components
 * - Validate existence
 * - Update layout
 *
 * @param {number} userId
 * @param {Object} layout
 * @returns {Promise<{id: number, components: Array}>}
 */
async function updateLayout(userId, layout) {
    const dashboard = await DashboardRepository.findByUserId(userId);
    const resolvedDashboard = throwIfNotExists(dashboard, 'dashboard', { userId });

    if (!Array.isArray(layout)) {
        throw new ValidationError('Layout inválido', { layout });
    }

    const layoutMap = Object.fromEntries(layout.map((item) => [String(item.id), item]));
    const updatePromises = resolvedDashboard.components.map((component) => {
        const item = layoutMap[String(component.id)];
        if (!item) return null;
        return DashboardRepository.updateComponentPosition(component.id, {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
        });
    });

    await Promise.all(updatePromises.filter(Boolean));

    const updatedDashboard = await DashboardRepository.findByUserId(userId);

    return {
        id: updatedDashboard.id,
        components: updatedDashboard.components,
    };
}

function validateKpiComponentInput(componentData) {
    const allowedEntities = ['Patient', 'Appointment', 'Diagnosis', 'Treatment'];
    const allowedAggregation = ['COUNT'];
    const allowedDates = ['today', 'last_7_days'];

    if (!componentData.title?.trim()) {
        throw new ValidationError('El título es obligatorio');
    }

    if (!allowedEntities.includes(componentData.entity)) {
        throw new ValidationError('Entidad no soportada', { entity: componentData.entity });
    }

    if (!allowedAggregation.includes(componentData.aggregation)) {
        throw new ValidationError('Agregación no soportada', { aggregation: componentData.aggregation });
    }

    if (componentData.filters?.date && !allowedDates.includes(componentData.filters.date)) {
        throw new ValidationError('Filtro temporal no soportado', { date: componentData.filters.date });
    }
}

function getNextAvailableY(components) {
    if (!components?.length) return 0;

    return Math.max(
        ...components.map((component) => {
            const y = component.position?.y ?? 0;
            const h = component.position?.h ?? 2;
            return y + h;
        }),
    );
}

/**
 * Creates a new component in a dashboard
 *
 * @param {number} userId
 * @param {Object} componentData
 * @returns {Promise<{Object}>}
 */
async function createComponent(userId, componentData) {
    const dashboard = await DashboardRepository.findByUserId(userId);
    const resolvedDashboard = throwIfNotExists(dashboard, 'dashboard', { userId });

    validateKpiComponentInput(componentData);

    const nextY = getNextAvailableY(resolvedDashboard.components);

    const newComponent = await DashboardRepository.createComponent({
        dashboardId: resolvedDashboard.id,
        title: componentData.title,
        type: 'KPI',
        position: {
            x: 0,
            y: nextY,
            w: 2,
            h: 2,
        },
        config: {
            visuals: componentData.visuals || { color: 'primary.main' },
            query: {
                entity: componentData.entity,
                aggregation: componentData.aggregation || 'COUNT',
                targetColumn: componentData.targetColumn || 'id',
                filters: componentData.filters || {},
            },
        },
    });

    return newComponent;
}

// ===== COMPONENT RESOLUTION =====

/**
 * Resolves a dashboard component into visualization-ready data.
 *
 * @param {Object} component
 * @returns {Promise<Object>}
 */
async function resolveComponent(component, userId) {
    const config = component.config || {};
    const queryDef = config.query;

    let data = null;

    if (queryDef) {
        data = await executeDynamicQuery(queryDef, userId);
    }

    return {
        id: component.id,
        title: component.title,
        vizType: component.type,
        source: component.source,
        position: component.position || { x: 0, y: 0, w: 2, h: 2 },
        config: config.visuals || {},
        data,
    };
}

// ===== QUERY ENGINE =====

/**
 * Executes a dynamic query definition.
 *
 * @param {Object} queryDef
 * @returns {Promise<Object|Array>}
 */
async function executeDynamicQuery(queryDef, userId) {
    const Model = ENTITY_MAP[queryDef.entity];

    if (!Model) {
        throw new ValidationError('Entidad no soportada en dashboard', { entity: queryDef.entity });
    }

    const { aggregation = 'COUNT', targetColumn = 'id', groupBy, timeGrain, filters = {}, limit, orderBy } = queryDef;

    const where = { ...filters };

    if (filters.date === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const dateField = queryDef.entity === 'Appointment' ? 'startTime' : 'createdAt';

        where[dateField] = {
            ...(where[dateField] || {}),
            [Op.between]: [start, end],
        };

        delete where.date;
    }

    if (filters.date === 'last_7_days') {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);

        const dateField = queryDef.entity === 'Appointment' ? 'startTime' : 'createdAt';

        where[dateField] = {
            ...(where[dateField] || {}),
            [Op.gte]: start,
        };

        delete where.date;
    }

    if (filters.upcoming) {
        where.startTime = {
            ...(where.startTime || {}),
            [Op.gte]: new Date(),
        };

        delete where.upcoming;
    }

    if (queryDef.scope === 'SELF' && userId) {
        where.userId = userId;
    }

    // ===== LIST =====
    if (queryDef.type === 'LIST') {
        const results = await Model.findAll({
            where,
            order: orderBy ? [[orderBy.field, orderBy.direction || 'ASC']] : undefined,
            limit: limit || 10,
            raw: true,
        });
        console.log('LIST DATA:', results);
        return results;
    }

    // ===== KPI =====
    if (!groupBy) {
        if (aggregation === 'COUNT') {
            const count = await Model.count({ where });
            return { value: count };
        }

        const result = await Model.findAll({
            attributes: [[fn(aggregation, col(targetColumn)), 'value']],
            where,
            raw: true,
        });

        return { value: Number(result[0]?.value) || 0 };
    }

    // ===== CHART =====

    let xAttribute;
    let groupCondition;

    if (timeGrain) {
        xAttribute = [fn('DATE_TRUNC', timeGrain, col(groupBy)), 'x'];
        groupCondition = fn('DATE_TRUNC', timeGrain, col(groupBy));
    } else {
        xAttribute = [groupBy, 'x'];
        groupCondition = groupBy;
    }

    const yAttribute = [fn(aggregation, col(targetColumn)), 'y'];

    const results = await Model.findAll({
        attributes: [xAttribute, yAttribute],
        where,
        group: [groupCondition],
        order: [[literal('x'), 'ASC']],
        raw: true,
    });

    return results;
}

/**
 * Deletes a dashboard component if it is not a system component.
 *
 * Workflow:
 * - Retrieves component by ID
 * - Ensures the component exists
 * - Ensures the component is user-created (not SYSTEM)
 * - Deletes the component
 *
 * @param {string} id - ID of the dashboard component
 * @param {number} userId - ID of the authenticated user performing the action
 *
 * @throws {NotFoundError} If the component does not exist
 * @throws {ValidationError} If attempting to delete a system component
 *
 * @returns {Promise<void>}
 */
async function deleteComponent(id) {
    return await sequelize.transaction(async (t) => {
        const component = await DashboardRepository.findComponentById(id, {transaction: t});
        throwIfNotExists(component, 'componente de dashboard');

        // Can't delete system components
        if (component.source === 'SYSTEM') throw new ValidationError('No se pueden eliminar componentes del sistema');

        await DashboardRepository.deleteComponent(component, {transaction: t});
    });
}

module.exports = {
    getDashboard,
    updateLayout,
    createComponent,
    deleteComponent,
};
