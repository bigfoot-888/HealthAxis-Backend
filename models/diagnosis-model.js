const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Diagnosis = sequelize.define('Diagnosis', {
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    severity: {
        type: DataTypes.ENUM('LOW', 'MODERATE', 'HIGH', 'CRITICAL'), allowNull: false
    },
    state: {
        type: DataTypes.ENUM('ACTIVE', 'RESOLVED', 'CHRONIC', 'RULED_OUT'),
        defaultValue: 'ACTIVE', allowNull: false
    },
    recordState: {
        type: DataTypes.ENUM('VALID', 'VOID', 'ENTERED_IN_ERROR'),
        defaultValue: 'VALID', allowNull: false
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
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false }
});

const DiagnosisUser = sequelize.define('DiagnosisUser', {
    role: {
        type: DataTypes.ENUM('AUTHOR', 'REVIEWER', 'VALIDATOR', 'CONTRIBUTOR'),
        allowNull: false,
        defaultValue: 'CONTRIBUTOR',
    },
    assignedAt: { // Date when the user was assigned to work on the diagnosis
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = {
    Diagnosis,
    DiagnosisUser
};
