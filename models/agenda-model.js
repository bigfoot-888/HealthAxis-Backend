const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agenda = sequelize.define(
    'Agenda',
    {
        name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        state: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE',
        },
        uuid: { type: DataTypes.STRING(36), allowNull: false },
    }
);

const AgendaPeriod = sequelize.define(
    'AgendaPeriod',
    {
        opening_date: { type: DataTypes.DATEONLY, allowNull: false,},
        closing_date: { type: DataTypes.DATEONLY, allowNull: false,},
        agenda_state: {
            type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED'),
            defaultValue: 'OPEN',
        },
        state: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE',
        },
        uuid: { type: DataTypes.STRING(36), allowNull: false },
    }
)

const associate = () => {
  Agenda.hasMany(AgendaPeriod, { foreignKey: 'agendaId' });

  Agenda.hasOne(AgendaPeriod, {
    as: 'activePeriod',
    foreignKey: 'agendaId',
    scope: { state: 'ACTIVE' },
    constraints: false,
  });

  AgendaPeriod.belongsTo(Agenda, { foreignKey: 'agendaId' });
};

module.exports = {
    Agenda,
    AgendaPeriod,
    associate
};
