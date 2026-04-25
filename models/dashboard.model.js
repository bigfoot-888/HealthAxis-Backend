const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserDashboard = sequelize.define(
    'UserDashboard',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
        },
    },
    {
        tableName: 'UserDashboards',
        timestamps: true,
    },
);

const DashboardComponent = sequelize.define(
    'DashboardComponent',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        dashboardId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'UserDashboards', key: 'id' },
            onDelete: 'CASCADE',
        },
        title: { type: DataTypes.STRING(100), allowNull: false },
        type: {
            type: DataTypes.ENUM('KPI', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART', 'LIST'),
            allowNull: false,
        },
        config: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        position: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        tableName: 'DashboardComponents',
        timestamps: true,
    },
);

module.exports = { UserDashboard, DashboardComponent };
