const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
    'User',
    {
        name: { type: DataTypes.STRING(50), allowNull: false },
        surname: { type: DataTypes.STRING(60), allowNull: false },
        email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        password: { type: DataTypes.STRING(255), allowNull: false },
        phone: { type: DataTypes.STRING(20), allowNull: false },
        state: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE',
        },
        uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false }
    }
);

module.exports = {User};
