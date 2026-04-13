const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define(
    'Permission',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        name: { 
            type: DataTypes.STRING(50), 
            allowNull: false, 
            unique: true 
        },
    },
    {
        tableName: 'Permissions', 
        timestamps: true, 
    }
);


const RolePermission = sequelize.define(
    'RolePermission',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Roles', key: 'id' }, 
            onDelete: 'CASCADE',
        },
        permissionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Permissions', key: 'id' }, 
            onDelete: 'CASCADE',
        },
    },
    {
        tableName: 'RolePermissions', 
        timestamps: true,
    }
);

module.exports = {
    Permission,
    RolePermission
}