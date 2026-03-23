const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Treatment = sequelize.define('Treatment', {
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    duration: { type: DataTypes.STRING(80), allowNull: true },
    state: {
        type: DataTypes.ENUM('PLANNED', 'ONGOING', 'GIVEN', 'COMPLETED', 'DISCONTINUED'), // GIVEN is for both single time treatments, and treatments without monitoring
        allowNull: false,
        defaultValue: 'PLANNED',
    },
    recordState: {
        type: DataTypes.ENUM('VALID', 'VOID', 'ENTERED_IN_ERROR'),
        defaultValue: 'VALID',
        allowNull: false
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
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
});

const TreatmentUser = sequelize.define('TreatmentUser', {
    role: {
        type: DataTypes.ENUM('AUTHOR', 'REVIEWER', 'VALIDATOR', 'CONTRIBUTOR'),
        allowNull: false,
        defaultValue: 'CONTRIBUTOR',
    },
    assignedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});


module.exports = {
    Treatment,
    TreatmentUser
};
