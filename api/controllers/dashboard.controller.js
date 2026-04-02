const dashboardService = require('../../services/dashboard.service');

// ===== DASHBOARD =====

async function getDashboardController(req, res) {
    // const userId = req.user.id; 
    const userId = 1; 
    const dashboard = await dashboardService.getDashboard(userId);
    res.status(200).json(dashboard);
}

module.exports = {
    getDashboardController,
};