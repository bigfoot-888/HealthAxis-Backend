
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
    reason: { type: DataTypes.STRING(255), allowNull: false},
    notes: { type: DataTypes.TEXT, allowNull: true},
    start_time: { type: DataTypes.DATE, allowNull: false,},
    end_time: { type: DataTypes.DATE, allowNull: true,},
    location: { type: DataTypes.STRING(100), allowNull: true},
    type: {
        type: DataTypes.ENUM('IN_PERSON', 'VIRTUAL'),
        defaultValue: 'IN_PERSON',
    },
    state: {
        type: DataTypes.ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'CHECKED_IN'),
        defaultValue: 'SCHEDULED',
    },
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false }
});

module.exports = {Appointment};