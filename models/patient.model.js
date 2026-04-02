const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define(
    'Patient',
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
        sex: { type: DataTypes.ENUM('MALE', 'FEMALE'), allowNull: false },
        name: { type: DataTypes.STRING(50), allowNull: false },
        surname: { type: DataTypes.STRING(60), allowNull: false },
        email: { type: DataTypes.STRING(100), allowNull: false },
        phone: { type: DataTypes.STRING(20), allowNull: false },
        addressLine1: { type: DataTypes.STRING(150), allowNull: false },
        addressLine2: { type: DataTypes.STRING(150), allowNull: true },
        dni: { type: DataTypes.STRING(20), allowNull: true, unique: true },
        dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
        nhc: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE',
        },
    },
    {
        tableName: 'Patients',
        timestamps: true,
    },
);

module.exports = { Patient };
