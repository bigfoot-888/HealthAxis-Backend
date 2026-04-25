const { Appointment, Treatment, Diagnosis, User, Patient } = require('../models/index');
const { Op, literal } = require('sequelize');
const { escapeLike } = require('../utils/query-utils');
const { ACTIVE_APPOINTMENT_STATUSES } = require('../utils/global.utils');
// ===== CREATE =====

async function create(data, options = {}) {
    return await Appointment.create(data, options);
}

// ===== READ =====

async function findAll(options = {}) {
    return await Appointment.findAll({
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', [literal(`"user"."name" || ' ' || "user"."surname"`), 'fullName']],
            },
            {
                model: Patient,
                as: 'patient',
                attributes: ['id', [literal(`"patient"."name" || ' ' || "patient"."surname"`), 'fullName']],
            },
        ],
        raw: true,
        nest: true,
        ...options,
    });
}

async function hasActiveAppointmentsByUserId(userId, options = {}) {
    const result = await Appointment.findOne({
        where: {
            userId,
            status: ACTIVE_APPOINTMENT_STATUSES,
        },
        attributes: ['id'], 
        ...options,
    });

    return result;
}

async function hasActiveAppointmentsByPatientId(patientId, options = {}) {
    const result = await Appointment.findOne({
        where: {
            patientId,
            status: ACTIVE_APPOINTMENT_STATUSES,
        },
        attributes: ['id'], 
        ...options,
    });

    return result;
}

async function findByUuid(uuid, options = {}) {
    return await Appointment.findOne({
        where: { uuid },
        include: [
            { model: User, as: 'user' },
            { model: Patient, as: 'patient' },
            {
                model: Diagnosis,
                as: 'diagnoses',
                include: [{ model: Treatment, as: 'treatments' }],
            },
        ],
        ...options,
    });
}

async function findByUuidPlain(uuid, options = {}) {
    return await Appointment.findOne({
        where: { uuid },
        ...options,
    });
}

async function findById(id, options={}) {
    return await Appointment.findByPk(id, {...options})
}

async function searchFiltered(query, limit = 20, options = {}) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;

    return await Appointment.findAll({
        attributes: ['id', 'startTime'],
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
            },
        ],
        order: [['id', 'DESC']],
        limit: Math.min(limit, 50),
        ...options,
    });
}

async function searchAppointments({ patient, practitioner, limit = 20 }) {
    const where = {};

    const conditions = [];

    if (patient) {
        conditions.push({
            '$patient.uuid$': patient,
        });
    }
    if (practitioner) {
        conditions.push({
            '$user.uuid$': practitioner,
        });
    }

    if (conditions.length > 0) {
        where[Op.and] = conditions;
    }

    return Appointment.findAll({
        where,
        include: [
            {
                model: Patient,
                as: 'patient',
                attributes: ['uuid', 'name', 'surname'],
            },
            {
                model: User,
                as: 'user',
                attributes: ['uuid', 'name', 'surname'],
            },
        ],
        limit,
        order: [['startTime', 'DESC']],
    });
}

// ===== UPDATE =====

async function updateByUuid(uuid, data, options = {}) {
    return await Appointment.update(data, {
        where: { uuid },
        ...options,
    });
}

module.exports = {
    create,

    findAll,
    findByUuid,
    findByUuidPlain,
    searchFiltered,
    searchAppointments,
    hasActiveAppointmentsByUserId,
    hasActiveAppointmentsByPatientId,
    findById,
    updateByUuid,
};
