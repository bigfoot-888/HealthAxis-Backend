const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define(
    'Appointment',
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
            unique: true 
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false, 
            references: { model: 'Users', key: 'id' },
            onDelete: 'RESTRICT', 
        },
        patientId: {
            type: DataTypes.INTEGER,
            allowNull: false, 
            references: { model: 'Patients', key: 'id' },
            onDelete: 'RESTRICT', 
        },
        reason: { type: DataTypes.STRING(255), allowNull: false },
        notes: { type: DataTypes.TEXT, allowNull: true },
        startTime: { type: DataTypes.DATE, allowNull: false },
        endTime: { type: DataTypes.DATE, allowNull: true },
        location: { type: DataTypes.STRING(100), allowNull: true },
        type: {
            type: DataTypes.ENUM('IN_PERSON', 'VIRTUAL'),
            defaultValue: 'IN_PERSON',
        },
        status: {
            type: DataTypes.ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'CHECKED_IN'),
            defaultValue: 'SCHEDULED',
        },
    },
    {
        tableName: 'Appointments', 
        timestamps: true,
    }
);

module.exports = { Appointment };