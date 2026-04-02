const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agenda = sequelize.define(
    'Agenda',
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
        name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE',
        },
    },
    {
        tableName: 'Agendas', 
        timestamps: true,
    }
);

const AgendaPeriod = sequelize.define(
    'AgendaPeriod',
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
        agendaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Agendas', key: 'id' },
            onDelete: 'RESTRICT', 
        },
        openingDate: { type: DataTypes.DATEONLY, allowNull: false },
        closingDate: { type: DataTypes.DATEONLY, allowNull: false },
        agendaStatus: {
            type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED'),
            defaultValue: 'OPEN',
        },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE',
        },
    },
    {
        tableName: 'AgendaPeriods', 
        timestamps: true,
    }
)

module.exports = {
    Agenda,
    AgendaPeriod,
};