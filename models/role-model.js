const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define(
    'Role',
    {
        name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    }
);

module.exports = {Role};
