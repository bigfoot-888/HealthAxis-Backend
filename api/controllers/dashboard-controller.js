const dashboardService = require('../../modules/dashboard-service');

// =========================
// DASHBOARD
// =========================

/**
 * Retrieves the full dashboard for the current user
 * Resolves all components into visualization-ready data
 *
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user (assumed from middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with resolved dashboard
 */
async function getDashboardController(req, res) {
    // const userId = req.user.id;
    const userId = 1; 
    console.log("CONTROLADOR DASHBOARD")
    const dashboard = await dashboardService.getDashboard(userId);
    console.log("hola")
    res.status(200).json(dashboard);
}

/**
 * Retrieves all dashboard components (resolved with data)
 *
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON array of components
 */
async function getDashboardComponentsController(req, res) {
    const userId = req.user.id;

    const components = await dashboardService.getDashboardComponents(userId);

    res.status(200).json(components);
}

/**
 * Retrieves a single dashboard component by ID (resolved with data)
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.id - Component ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON object with component data
 */
async function getDashboardComponentController(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    const component = await dashboardService.getDashboardComponentById(userId, id);

    res.status(200).json(component);
}

module.exports = {
    getDashboardController,
    getDashboardComponentsController,
    getDashboardComponentController
};