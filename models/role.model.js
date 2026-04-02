const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define(
    'Role',
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
        tableName: 'Roles', 
        timestamps: true, 
    }
);

const UserRole = sequelize.define(
    'UserRole',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' }, 
            onDelete: 'CASCADE',
        },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Roles', key: 'id' }, 
            onDelete: 'CASCADE',
        },
    },
    {
        tableName: 'UserRoles', 
        timestamps: true,
    }
);

module.exports = { 
    Role,
    UserRole
};