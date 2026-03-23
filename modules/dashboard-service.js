const { UserDashboard, DashboardComponent, Patient, Appointment, Diagnosis, Treatment } = require('../models/index');
const NotFoundError = require('../errors/NotFoundError');
const { fn, col, literal } = require('sequelize');

// Map string names from the JSON config to the actual Sequelize models
const ENTITY_MAP = {
    Patient,
    Appointment,
    Diagnosis,
    Treatment
};

/**
 * Retrieves the full dashboard for a user and resolves all components
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Dashboard with resolved components
 */
async function getDashboard(userId) {
    const dashboard = await UserDashboard.findOne({
        where: { userId },
        include: [{ model: DashboardComponent, as: 'components' }]
    });

    if (!dashboard) {
        throw new NotFoundError('Dashboard not found for user', { userId });
    }

    const resolvedComponents = await Promise.all(
        dashboard.components.map(resolveComponent)
    );

    return {
        id: dashboard.id,
        components: resolvedComponents
    };
}

/**
 * Retrieves all dashboard components for a user (resolved)
 */
async function getDashboardComponents(userId) {
    const dashboard = await UserDashboard.findOne({
        where: { userId },
        include: [{ model: DashboardComponent, as: 'components' }]
    });

    if (!dashboard) {
        throw new NotFoundError('Dashboard not found for user', { userId });
    }

    return await Promise.all(dashboard.components.map(resolveComponent));
}

/**
 * Retrieves a single dashboard component by ID (resolved)
 */
async function getDashboardComponentById(userId, componentId) {
    const component = await DashboardComponent.findOne({
        where: { id: componentId },
        include: [{ model: UserDashboard, as: 'dashboard', where: { userId } }]
    });

    if (!component) {
        throw new NotFoundError('Dashboard component not found', { componentId });
    }

    return await resolveComponent(component);
}

// =========================
// COMPONENT RESOLUTION
// =========================

/**
 * Resolves a dashboard component by executing its dynamic query definition
 * @param {Object} component - DashboardComponent instance
 * @returns {Promise<Object>} Resolved component structured for the frontend
 */
async function resolveComponent(component) {
    const config = component.config || {};
    const queryDef = config.query;
    let data = null;

    if (queryDef) {
        try {
            data = await executeDynamicQuery(queryDef);
        } catch (error) {
            console.error(`Failed to execute dynamic query for component ${component.id}:`, error);
            // Optionally set data to a specific error state here if needed
        }
    }

    // Return the perfectly formatted "Visualization-Driven" payload
    return {
        id: component.id,
        title: component.title,
        vizType: component.type, // 'KPI', 'LINE_CHART', etc.
        position: component.position || { x: 0, y: 0, w: 2, h: 2 }, // Fallback if missing
        config: config.visuals || {}, // Pass only the visual settings to the frontend
        data
    };
}

// =========================
// THE DYNAMIC QUERY ENGINE
// =========================

/**
 * Parses the JSON query definition and builds the Sequelize query
 * * Expected queryDef structure:
 * {
 * entity: "Patient",             // Model to query
 * aggregation: "COUNT",          // SQL function (COUNT, SUM, AVG)
 * targetColumn: "id",            // Column to aggregate
 * groupBy: "createdAt",          // (Optional) Column for the X-axis
 * timeGrain: "month",            // (Optional) Used if groupBy is a date (year, month, day)
 * filters: { state: "ACTIVE" }   // (Optional) Where clause
 * }
 */
async function executeDynamicQuery(queryDef) {
    const Model = ENTITY_MAP[queryDef.entity];
    
    if (!Model) {
        throw new Error(`Unsupported entity: ${queryDef.entity}`);
    }

    // Set defaults just in case the JSON is missing them
    const { 
        aggregation = 'COUNT', 
        targetColumn = 'id', 
        groupBy, 
        timeGrain, 
        filters = {} 
    } = queryDef;

    const where = { ...filters };

    // ----------------------------------------------------
    // SCENARIO 1: KPI (No grouping, just a single metric)
    // ----------------------------------------------------
    if (!groupBy) {
        if (aggregation === 'COUNT') {
            const count = await Model.count({ where });
            return { value: count };
        } else {
            // For SUM, AVG, etc.
            const result = await Model.findAll({
                attributes: [[fn(aggregation, col(targetColumn)), 'value']],
                where,
                raw: true
            });
            // Result is an array like [{ value: 150 }]
            return { value: Number(result[0]?.value) || 0 };
        }
    }

    // ----------------------------------------------------
    // SCENARIO 2: CHARTS (Grouping required to create {x, y})
    // ----------------------------------------------------
    let xAttribute;
    let groupCondition;

    if (timeGrain) {
        // It's a Time-Series Chart (e.g., group by Month)
        xAttribute = [fn('DATE_TRUNC', timeGrain, col(groupBy)), 'x'];
        groupCondition = fn('DATE_TRUNC', timeGrain, col(groupBy)); 
    } else {
        // It's a Categorical Chart (e.g., group by severity, state)
        xAttribute = [groupBy, 'x'];
        groupCondition = groupBy;
    }

    const yAttribute = [fn(aggregation, col(targetColumn)), 'y'];

    const results = await Model.findAll({
        attributes: [xAttribute, yAttribute],
        where,
        group: [groupCondition],
        order: [[literal('x'), 'ASC']], // Always order chronologically/alphabetically
        raw: true
    });

    return results;
}

module.exports = {
    getDashboard,
    getDashboardComponents,
    getDashboardComponentById,
};