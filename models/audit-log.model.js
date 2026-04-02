const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define(
    'AuditLog',
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
        action: {
            type: DataTypes.ENUM('CREATED', 'STATUS_CHANGED'),
            allowNull: false,
        },
        entityType: {
            type: DataTypes.ENUM('DIAGNOSIS', 'TREATMENT', 'APPOINTMENT', 'CLINICAL_DOCUMENT', 'PATIENT'),
            allowNull: false,
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        meta: {
            type: DataTypes.JSON, 
        },
    },
    {
        tableName: 'AuditLogs', 
        timestamps: true,
        indexes: [
            { fields: ['patientId'] }, 
            { fields: ['entityType', 'entityId'] }
        ],
    }
);

module.exports = {
    AuditLog,
};