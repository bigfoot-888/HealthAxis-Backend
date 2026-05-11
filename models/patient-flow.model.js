const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// The container for the flow events for a specific patient
const PatientFlow = sequelize.define(
    'PatientFlow',
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
        patientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Patients', key: 'id' },
            onDelete: 'CASCADE', 
        },
    },
    {
        tableName: 'PatientFlows',
        timestamps: true,
    }
);

const FlowEvent = sequelize.define(
    'FlowEvent',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        patientFlowId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'PatientFlows', key: 'id' },
            onDelete: 'CASCADE',
        },
        date: { type: DataTypes.DATE, allowNull: false },
        title: { type: DataTypes.STRING(100), allowNull: false },
        type: {
            type: DataTypes.ENUM('APPOINTMENT', 'DIAGNOSIS', 'TREATMENT', 'CLINICAL_DOCUMENT', 'PATIENT', 'OTHER'),
            defaultValue: 'OTHER',
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('PRIMARY', 'SECONDARY'),
            defaultValue: 'PRIMARY',
            allowNull: false,
        },
        parentEventId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'FlowEvents', key: 'id' },
            onDelete: 'SET NULL', 
        },
        entityId: { type: DataTypes.INTEGER }, 
        positionX: { type: DataTypes.FLOAT },
        positionY: { type: DataTypes.FLOAT },
    },
    {
        tableName: 'FlowEvents',
        timestamps: true,
    }
);


module.exports = { 
    PatientFlow, 
    FlowEvent, 
};