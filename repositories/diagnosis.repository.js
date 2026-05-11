const { Diagnosis, User, Treatment, Patient, Appointment } = require('../models/index');
const { Op, literal } = require('sequelize');
const { escapeLike } = require('../utils/query-utils');

// ===== CREATE =====

async function create(data, options = {}) {
    return await Diagnosis.create(data, options);
}

async function addUser(diagnosis, userId, throughData, options = {}) {
    return await diagnosis.addUser(userId, {
        through: throughData,
        ...options,
    });
}

async function associateUsers(diagnosis, users = [], options = {}) {
    await diagnosis.setUsers([], options);

    return await Promise.all(
        users.map(({ userId, role }) =>
            diagnosis.addUser(userId, {
                through: { role },
                ...options,
            })
        )
    );
}

// ===== READ =====

async function findAll(options = {}) {
    return await Diagnosis.findAll({
        include: [
            {
                model: User,
                as: 'users',
                attributes: ['id', 'uuid', [literal(`"users"."name" || ' ' || "users"."surname"`), 'fullName']],
            },
            { model: Treatment, as: 'treatments' },
            {
                model: Patient,
                as: 'patient',
                attributes: ['id', 'uuid', [literal(`"patient"."name" || ' ' || "patient"."surname"`), 'fullName']],
            },
        ],
        ...options,
    });
}

async function findAllPlain(options = {}) {
    return await Diagnosis.findAll(options);
}

async function findByUuid(uuid, options = {}) {
    return await Diagnosis.findOne({
        where: { uuid },
        include: [
            { model: Treatment, as: 'treatments' },
            {
                model: User,
                as: 'users',
                through: {
                    as: 'assignment',
                    attributes: ['role'],
                },
            },
            { model: Patient, as: 'patient' },
            {
                model: Appointment,
                as: 'appointment',
                include: [
                    { model: User, as: 'user' },
                    { model: Patient, as: 'patient' },
                ],
            },
        ],
        ...options,
    });
}

async function findByUuidPlain(uuid, options = {}) {
    return await Diagnosis.findOne({
        where: { uuid },
        ...options,
    });
}

async function searchFiltered(query, limit = 20, options = {}) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;

    return await Diagnosis.findAll({
        attributes: ['id', 'name', 'uuid'],
        where: {
            [Op.or]: [
                { name: { [Op.iLike]: safeQuery } },
                { '$patient.name$': { [Op.iLike]: safeQuery } },
                { '$patient.surname$': { [Op.iLike]: safeQuery } },
            ],
        },
        include: [
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

async function searchDiagnoses({ patient, name, limit = 20 }) {
    const conditions = [];
    const where = {
        status: 'VALID',
    };
    // Filter by patient UUID
    if (patient) {
        conditions.push({
            '$patient.uuid$': patient,
        });
    }

    // Filter by diagnosis name
    if (name) {
        const safeName = `%${escapeLike(name)}%`;

        conditions.push({
            name: { [Op.iLike]: safeName },
        });
    }

    if (conditions.length > 0) {
        where[Op.and] = conditions;
    }

    return Diagnosis.findAll({
        where,
        include: [
            {
                model: Patient,
                as: 'patient',
                attributes: ['uuid'],
            },
        ],
        limit,
        order: [['createdAt', 'DESC']],
    });
}

// ===== UPDATE =====

async function updateClinicalStatusByUuid(uuid, clinicalStatus, options = {}) {
    return await Diagnosis.update(
        { clinicalStatus },
        {
            where: { uuid },
            ...options,
        },
    );
}

async function updateRecordStatusByUuid(uuid, status, options = {}) {
    return await Diagnosis.update(
        { status },
        {
            where: { uuid },
            ...options,
        },
    );
}

async function updateResolvedAt(uuid, resolvedAt, options = {}) {
    return await Diagnosis.update(
        { resolvedAt },
        {
            where: { uuid },
            ...options,
        },
    );
}

async function updateByUuid(uuid, data, options = {}) {
    return await Diagnosis.update(data, {
        where: { uuid },
        ...options,
    });
}

module.exports = {
    create,
    addUser,
    associateUsers,

    findAll,
    findAllPlain,
    findByUuid,
    findByUuidPlain,
    searchFiltered,
    searchDiagnoses,

    updateClinicalStatusByUuid,
    updateRecordStatusByUuid,
    updateResolvedAt,
    updateByUuid,
};
