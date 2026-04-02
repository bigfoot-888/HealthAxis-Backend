const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Treatment = sequelize.define(
    'Treatment',
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
        },
        appointmentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Appointments', key: 'id' },
        },
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        duration: { type: DataTypes.STRING(80), allowNull: true },
        clinicalStatus: {
            type: DataTypes.ENUM('PLANNED', 'ONGOING', 'GIVEN', 'COMPLETED', 'DISCONTINUED'),
            allowNull: false,
            defaultValue: 'PLANNED',
        },
        status: {
            type: DataTypes.ENUM('VALID', 'VOID', 'ENTERED_IN_ERROR'),
            defaultValue: 'VALID',
            allowNull: false,
        },
        devisedAt: {
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
        tableName: 'Treatments',
        timestamps: true,
    },
);

const TreatmentUser = sequelize.define(
    'TreatmentUser',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        treatmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Treatments', key: 'id' },
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
        assignedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'TreatmentUsers',
        timestamps: true,
    },
);

module.exports = {
    Treatment,
    TreatmentUser,
};
