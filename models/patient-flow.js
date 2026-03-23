const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');


// The container for the flow events for a specific patient
const PatientFlow = sequelize.define('PatientFlow', {
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
});

// 
const FlowEvent = sequelize.define('FlowEvent', {
    date: { type: DataTypes.DATE, allowNull: false },
    title: { type: DataTypes.STRING(100), allowNull: false },
    type: {
        type: DataTypes.ENUM('APPOINTMENT', 'DIAGNOSIS', 'TREATMENT', 'CLINICAL_DOCUMENT', 'OTHER', 'REGISTRATION', 'REACTIVATION', 'DEACTIVATION'),
        defaultValue: 'OTHER',
        allowNull: false,
    },

    // Main vs. supporting event
    role: {
        type: DataTypes.ENUM('PRIMARY', 'SECONDARY'),
        defaultValue: 'PRIMARY',
        allowNull: false
    },

    parentEventId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    entityId: { type: DataTypes.INTEGER},
    positionX: { type: DataTypes.FLOAT },
    positionY: { type: DataTypes.FLOAT }
});

const FlowEdge = sequelize.define('FlowEdge', {
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
});

module.exports = { PatientFlow, FlowEvent, FlowEdge };
