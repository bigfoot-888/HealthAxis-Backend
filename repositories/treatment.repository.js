const { Treatment, User, Diagnosis, Patient } = require('../models/index');
const { Op, literal } = require('sequelize');
const { escapeLike } = require('../utils/query-utils');

// ===== CREATE =====

async function create(treatmentData, options = {}) {
    return await Treatment.create({ ...treatmentData }, options);
}

async function bulkCreate(treatments, options = {}) {
    return await Treatment.bulkCreate(treatments, options);
}

async function associateUsers(treatment, users = [], options = {}) {
    return await Promise.all(
        users.map(({ user }) => {
            const throughData = {
                role: user.role,
                ...(user.assignedAt && { assignedAt: user.assignedAt }),
            };

            return treatment.addUser(user.id, {
                through: throughData,
                ...options,
            });
        }),
    );
}

// ===== READ =====

async function findAll(options = {}) {
    return await Treatment.findAll({
        include: [
            {
                model: User,
                as: 'users',
                attributes: ['id', [literal(`"users"."name" || ' ' || "users"."surname"`), 'fullName']],
            },
            { model: Diagnosis, as: 'diagnosis' },
            {
                model: Patient,
                as: 'patient',
                attributes: ['id', [literal(`"patient"."name" || ' ' || "patient"."surname"`), 'fullName']],
            },
        ],
        ...options,
    });
}

async function findByUuidPlain(uuid, options = {}) {
    return await Treatment.findOne({
        where: { uuid },
        ...options,
    });
}

async function findByUuidDetailed(uuid, options = {}) {
    return await Treatment.findOne({
        where: { uuid },
        include: [
            { model: Diagnosis, as: 'diagnosis' },
            { model: User, as: 'users' },
            { model: Patient, as: 'patient' },
        ],
        ...options,
    });
}

async function searchFiltered(query, limit = 20, options = {}) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;

    return await Treatment.findAll({
        attributes: ['id', 'name'],
        where: {
            clinicalStatus: {
                [Op.in]: ['PLANNED', 'ONGOING', 'GIVEN', 'COMPLETED', 'DISCONTINUED'],
            },
            name: { [Op.iLike]: safeQuery },
        },
        order: [['name', 'ASC']],
        limit: Math.min(limit, 50),
        ...options,
    });
}

async function searchTreatments({ patient, name, limit = 20 }) {
    const where = {
        status: 'VALID',
    };

    const conditions = [];

    // Filter by patient UUID
    if (patient) {
        conditions.push({
            '$patient.uuid$': patient,
        });
    }

    // Filter by treatment name
    if (name) {
        const safeName = `%${escapeLike(name)}%`;

        conditions.push({
            name: { [Op.iLike]: safeName },
        });
    }

    if (conditions.length > 0) {
        where[Op.and] = conditions;
    }

    return Treatment.findAll({
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

async function updateClinicalStatus(uuid, newClinicalStatus, options = {}) {
    return await Treatment.update(
        { clinicalStatus: newClinicalStatus },
        {
            where: { uuid },
            ...options,
        },
    );
}

async function updateStatus(uuid, newStatus, options = {}) {
    return await Treatment.update(
        { status: newStatus },
        {
            where: { uuid },
            ...options,
        },
    );
}

module.exports = {
    create,
    bulkCreate,
    associateUsers,
    findAll,
    findByUuidPlain,
    findByUuidDetailed,
    searchFiltered,
    searchTreatments,
    updateClinicalStatus,
    updateStatus,
};
