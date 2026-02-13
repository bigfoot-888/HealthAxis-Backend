const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    sex: { type: DataTypes.ENUM('MALE', 'FEMALE'), allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    surname: { type: DataTypes.STRING(60), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    address_line1: { type: DataTypes.STRING(150), allowNull: false,},
    address_line2: { type: DataTypes.STRING(150), allowNull: true,},
    dni: {type: DataTypes.STRING(20), allowNull: true, unique: true,},
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: false,},
    nhc: { type: DataTypes.STRING(20), allowNull: false, unique: true,},
    state: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
    },
    uuid: { type: DataTypes.STRING(36), allowNull: false },
});

module.exports = Patient;