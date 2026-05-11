const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Diagnosis = sequelize.define(
    'Diagnosis',
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
        patientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Patients', key: 'id' },
            onDelete: 'CASCADE',
        },
        appointmentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Appointments', key: 'id' },
            onDelete: 'SET NULL',
        },
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        severity: {
            type: DataTypes.ENUM('LOW', 'MODERATE', 'HIGH', 'CRITICAL'),
            allowNull: false,
        },
        clinicalStatus: {
            type: DataTypes.ENUM('ACTIVE', 'RESOLVED', 'CHRONIC', 'RULED_OUT'),
            defaultValue: 'ACTIVE',
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('VALID', 'VOID', 'ENTERED_IN_ERROR'),
            defaultValue: 'VALID',
            allowNull: false,
        },
        diagnosedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'Diagnoses',
        timestamps: true,
    },
);

const DiagnosisUser = sequelize.define(
    'DiagnosisUser',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        diagnosisId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Diagnoses', key: 'id' },
            onDelete: 'CASCADE',
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
        },
        role: {
            type: DataTypes.ENUM('AUTHOR', 'REVIEWER', 'VALIDATOR', 'CONTRIBUTOR'),
            allowNull: false,
            defaultValue: 'CONTRIBUTOR',
        },
    },
    {
        tableName: 'DiagnosisUsers',
        timestamps: true,
    },
);

module.exports = {
    Diagnosis,
    DiagnosisUser,
};
