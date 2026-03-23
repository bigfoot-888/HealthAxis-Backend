const { Agenda, Appointment, User, Patient } = require('../models/index');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const { Op, literal} = require('sequelize');
const sequelize = require('../config/database');

const {createPrimaryFlowEvent} = require('../utils/flow-event')

// ===== CREATE =====

async function createAppointment(appointmentData) {
    return sequelize.transaction(async (t) => {
        const appointment = await Appointment.create({ ...appointmentData}, {transaction: t});
        await createPrimaryFlowEvent({
            patientId: appointment.patientId,
            type: 'APPOINTMENT',
            title: 'Cita registrada en el sistema',
            transaction: t,
        });
        return appointment; 
    })
}

// ===== READ =====

async function getAppointments() {
    return await Appointment.findAll({
        include: [
            { model: Agenda, as: 'agenda' },
            { model: User, as: 'user', attributes: ['id', [literal(`"user"."name" || ' ' || "user"."surname"`), 'fullName']]},
            { model: Patient, as: 'patient', attributes: ['id', [literal(`"patient"."name" || ' ' || "patient"."surname"`), 'fullName']] },
        ],
        raw: true,
        nest: true,
    });
}

async function getAppointmentsPlain() {
    return await Appointment.findAll();
}

async function getAppointmentById(id) {
    const appointment = await Appointment.findByPk(id, {
        include: [{ model: Agenda, as: 'agenda' }],
    });
    if (appointment === null) 
        throw new NotFoundError('Error, cita no encontrada', { id });
    return appointment;
}

async function getAppointment(uuid) {
    const appointment = await Appointment.findOne({
        where: { uuid },
        include: [
            { model: Agenda, as: 'agenda' },
            { model: User, as: 'user' },
            { model: Patient, as: 'patient' },
        ],
    });
    if (appointment === null) throw new NotFoundError('Error, cita no encontrada', { uuid });
    return appointment;
}

async function getAppointmentPlain(uuid) {
    const appointment = await Appointment.findOne({
        where: { uuid },
    });
    if (appointment === null) throw new NotFoundError('Error, cita no encontrada', { uuid });
    return appointment;
}

async function getAppointmentByIdPlain(id) {
    const appointment = await Appointment.findByPk(id);
    if (appointment === null) throw new NotFoundError('Error, cita no encontrada', { id });
    return appointment  ;
}

// Treat query as a literal string, escaping % and _ characters
const escapeLike = (str) => str.replace(/[%_]/g, '\\$&');

async function getFilteredAppointments(query, limit = 20) {
    if (!query || query.length < 2) {
        return [];
    }
    const safeQuery = `%${escapeLike(query)}%`;
    const appointments = await Appointment.findAll({
        attributes: ['id', 'start_time'],
        where: {
            [Op.or]: [
                { '$user.name$': { [Op.iLike]: safeQuery } },
                { '$user.surname$': { [Op.iLike]: safeQuery } },
                { '$patient.name$': { [Op.iLike]: safeQuery } },
                { '$patient.surname$': { [Op.iLike]: safeQuery } },
            ],
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['name', 'surname'],
                required: false,
            },
            {
                model: Patient,
                as: 'patient',
                attributes: ['name', 'surname'],
                required: false,
            }
        ],
        order: [
            ['id', 'DESC'],
        ],
        limit: Math.min(limit, 50),
    });
    return appointments;
}

// ===== UPDATE =====

async function updateAppointment(uuid, appointmentData) {
    const [count] = await Appointment.update({ ...appointmentData }, { where: { uuid } });
    if (count === 0) throw new NotFoundError('Error, cita no encontrada', { uuid });
    return count;
}

async function updateAppointmentState(uuid, payload) {
    const [count] = await Appointment.update({ ...payload }, { where: { uuid } });
    if (count === 0) throw new NotFoundError('Error, cita no encontrada', { uuid });
    return count;
}

module.exports = {
    createAppointment,
    getAppointments,
    getAppointmentsPlain,
    getAppointmentById,
    getAppointmentByIdPlain,
    getAppointmentPlain,
    getFilteredAppointments,
    getAppointment,
    updateAppointment,
    updateAppointmentState,
};
