const { UserDashboard, DashboardComponent } = require('../models/index');

// ===== READ =====

async function findByUserId(userId, options = {}) {
    return await UserDashboard.findOne({
        where: { userId },
        include: [{ model: DashboardComponent, as: 'components' }],
        ...options,
    });
}

module.exports = {
    findByUserId,
};