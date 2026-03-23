const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserDashboard = sequelize.define('UserDashboard', {
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
});

const DashboardComponent = sequelize.define('DashboardComponent', {
    title: { type: DataTypes.STRING(100), allowNull: false },
    type: {
        type: DataTypes.ENUM('KPI', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART'),
        allowNull: false,
    },

    config: {
        type: DataTypes.JSON,
        allowNull: true,
    },

    position: {
        type: DataTypes.JSON, // { x, y, w, h }
        allowNull: true,
    },
});

module.exports = { UserDashboard, DashboardComponent };
