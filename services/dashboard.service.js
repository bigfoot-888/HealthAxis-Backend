const { fn, col, literal } = require('sequelize');

const DashboardRepository = require('../repositories/dashboard.repository');

const { Patient, Appointment, Diagnosis, Treatment } = require('../models/index');
const ValidationError = require('../errors/ValidationError');

const { throwIfNotExists } = require('../utils/error-utils');

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

    const resolvedComponents = await Promise.all(resolvedDashboard.components.map(resolveComponent));

    return {
        id: resolvedDashboard.id,
        components: resolvedComponents,
    };
}

// ===== COMPONENT RESOLUTION =====

/**
 * Resolves a dashboard component into visualization-ready data.
 *
 * @param {Object} component
 * @returns {Promise<Object>}
 */
async function resolveComponent(component) {
    const config = component.config || {};
    const queryDef = config.query;

    let data = null;

    if (queryDef) {
        data = await executeDynamicQuery(queryDef);
    }

    return {
        id: component.id,
        title: component.title,
        vizType: component.type,
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
async function executeDynamicQuery(queryDef) {
    const Model = ENTITY_MAP[queryDef.entity];

    if (!Model) {
        throw new ValidationError('Entidad no soportada en dashboard', { entity: queryDef.entity });
    }

    const { aggregation = 'COUNT', targetColumn = 'id', groupBy, timeGrain, filters = {} } = queryDef;

    const where = { ...filters };

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

module.exports = {
    getDashboard,
};
