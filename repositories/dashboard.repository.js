const { UserDashboard, DashboardComponent } = require('../models/index');

// ===== CREATE =====

async function createComponent(componentData, options = {}) {
    return DashboardComponent.create(componentData, options);
}

// ===== READ =====

async function findByUserId(userId, options = {}) {
    return await UserDashboard.findOne({
        where: { userId },
        include: [{ model: DashboardComponent, as: 'components' }],
        ...options,
    });
}

async function findComponentById(id, options = {}) {
    return await DashboardComponent.findByPk(id, { ...options });
}

// ===== UPDATE =====

async function updateComponentPosition(componentId, position) {
    return DashboardComponent.update({ position }, { where: { id: componentId } });
}

// ===== DELETE =====

async function deleteComponent(component, options = {}) {
    return await component.destroy(options);
}

module.exports = {
    findByUserId,
    updateComponentPosition,
    createComponent,
    findComponentById,
    deleteComponent
};
