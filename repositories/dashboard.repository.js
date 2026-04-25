const { UserDashboard, DashboardComponent } = require('../models/index');

// ===== READ =====

async function findByUserId(userId, options = {}) {
    return await UserDashboard.findOne({
        where: { userId },
        include: [{ model: DashboardComponent, as: 'components' }],
        ...options,
    });
}

async function updateComponentPosition(componentId, position) {
    console.log(position)
    return DashboardComponent.update(
        { position },
        { where: { id: componentId } }
    );
}

async function createComponent(componentData, options = {}) {
    return DashboardComponent.create(componentData, options);
}

module.exports = {
    findByUserId,
    updateComponentPosition,
    createComponent
};