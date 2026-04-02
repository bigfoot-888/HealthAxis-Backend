const { Patient, Appointment, Treatment, Diagnosis, PatientFlow, FlowEvent } = require('../models/index');
const { Op } = require('sequelize');
const { escapeLike } = require('../utils/query-utils');

// ===== CREATE =====

async function create(patientData, options = {}) {
    return await Patient.create(patientData, options);
}

async function bulkCreate(patients, options = {}) {
    return await Patient.bulkCreate(patients, options);
}

async function save(patient, options = {}) {
    return await patient.save(options);
}

// ===== READ =====

async function findAllPlain(options = {}) {
    return await Patient.findAll(options);
}

async function searchFiltered(query, limit = 20, options = {}) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;

    return await Patient.findAll({
        attributes: ['id', 'name', 'surname', 'nhc'],
        where: {
            status: 'ACTIVE',
            [Op.or]: [
                { name: { [Op.iLike]: safeQuery } },
                { surname: { [Op.iLike]: safeQuery } },
                { nhc: { [Op.iLike]: safeQuery } },
            ],
        },
        order: [['surname', 'ASC'], ['name', 'ASC']],
        limit: Math.min(limit, 50),
        ...options,
    });
}

async function searchPatients({ identifier, name, limit = 20 }) {
    const where = {
        status: 'ACTIVE',
    };
    const conditions = [];
    // NHC or DNI
    if (identifier) {
        conditions.push({
            [Op.or]: [
                { nhc: { [Op.iLike]: `%${escapeLike(identifier)}%` } },
                { dni: { [Op.iLike]: `%${escapeLike(identifier)}%` } },
            ],
        });
    }
    // Name or surname
    if (name) {
        const safeName = `%${escapeLike(name)}%`;

        conditions.push({
            [Op.or]: [
                { name: { [Op.iLike]: safeName } },
                { surname: { [Op.iLike]: safeName } },
            ],
        });
    }

    // Combine conditions
    if (conditions.length > 0) {
        where[Op.and] = conditions;
    }

    return Patient.findAll({
        where,
        limit,
        order: [['createdAt', 'DESC']],
    });
}

async function findByUuidPlain(uuid, options = {}) {
    return await Patient.findOne({
        where: { uuid },
        ...options,
    });
}

async function findByUuidDetailed(uuid, options = {}) {
    return await Patient.findOne({
        where: { uuid },
        include: [
            { model: Appointment, as: 'appointments' },
            { model: Diagnosis, as: 'diagnoses' },
            { model: Treatment, as: 'treatments' },
        ],
        ...options,
    });
}

async function findByIdPlain(id, options = {}) {
    return await Patient.findByPk(id, options);
}

async function findFlowByPatientId(patientId, options = {}) {
    return await PatientFlow.findOne({
        where: { patientId },
        include: [{ model: FlowEvent, as: 'events' }],
        ...options,
    });
}

async function findAppointmentsByIds(ids = [], options = {}) {
    if (ids.length === 0) return [];
    return await Appointment.findAll({
        where: { id: ids },
        ...options,
    });
}

async function findDiagnosesByIds(ids = [], options = {}) {
    if (ids.length === 0) return [];
    return await Diagnosis.findAll({
        where: { id: ids },
        ...options,
    });
}

async function findTreatmentsByIds(ids = [], options = {}) {
    if (ids.length === 0) return [];
    return await Treatment.findAll({
        where: { id: ids },
        ...options,
    });
}

// ===== UPDATE =====

async function updateByUuid(uuid, patientData, options = {}) {
    return await Patient.update(
        { ...patientData },
        {
            where: { uuid },
            ...options,
        },
    );
}

async function updateStatusById(id, status, options = {}) {
    return await Patient.update(
        { status },
        {
            where: { id },
            ...options,
        },
    );
}

module.exports = {
    create,
    bulkCreate,
    save,
    findAllPlain,
    searchFiltered,
    searchPatients,
    findByUuidPlain,
    findByUuidDetailed,
    findByIdPlain,
    findFlowByPatientId,
    findAppointmentsByIds,
    findDiagnosesByIds,
    findTreatmentsByIds,
    updateByUuid,
    updateStatusById,
};