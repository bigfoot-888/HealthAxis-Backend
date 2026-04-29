const dashboardService = require('../../services/dashboard.service');

// ===== DASHBOARD =====

async function getDashboardController(req, res) {
    const userId = req.user.id; 
    const dashboard = await dashboardService.getDashboard(userId);
    res.status(200).json(dashboard);
}

async function updateLayoutController(req, res) {
    const userId = req.user.id; 
    const {layout} = req.body; 
    const dashboard = await dashboardService.updateLayout(userId, layout);
    res.status(200).json(dashboard);
}

async function createComponentController(req, res) {
    const userId = req.user.id;
    const component = await dashboardService.createComponent(userId, req.body);
    res.status(201).json(component);
}

async function deleteComponentController(req, res) {
    const { id } = req.params;
    await dashboardService.deleteComponent(id);
    res.status(204).send();
}

module.exports = {
    getDashboardController,
    createComponentController,
    updateLayoutController,
    deleteComponentController
};