const { Diagnosis, DiagnosisUser, User, Treatment, Patient } = require('../models/index');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const { Op, literal } = require('sequelize');
const sequelize = require('../config/database');

const {createPrimaryFlowEvent} = require('../utils/flow-event')

// ===== CREATE =====

/**
 * Creates a diagnosis and associates it with users
 * @param {Object} diagnosisData - Diagnosis data
 * @param {Array<Object>} users - Users associated to the diagnosis
 * @returns {Promise<Object>} The resulting diagnosis
 */

async function createDiagnosis(diagnosisData, users) {
    return sequelize.transaction(async (t) => {
        const diagnosis = await Diagnosis.create({ ...diagnosisData }, { transaction: t });

        await Promise.all(
            users.map(({ user }) => {
                const throughData = {
                    role: user.role,
                    ...(user.assignedAt && { assignedAt: user.assignedAt }),
                };
                return diagnosis.addUser(user.id, {
                    through: throughData,
                    transaction: t,
                });
            }),
        );

        // Create diagnosis flow event
        await createPrimaryFlowEvent({
            patientId: diagnosis.patientId,
            type: 'DIAGNOSIS',
            title: 'Diagnóstico registardo en el sistema',
            transaction: t,
        });
        return diagnosis;
    });
}

// ===== READ =====

async function getDiagnosesPlain() {
    return await Diagnosis.findAll();
}

async function getDiagnosesAndUsers() {
    return await Diagnosis.findAll({
        include: [{ model: User, as: 'users' }],
        raw: true,
        nest: true,
    });
}
async function getDiagnosesAndTreatments() {
    return await Diagnosis.findAll({
        include: [{ model: Treatment, as: 'treatments' }],
        raw: true,
        nest: true,
    });
}

async function getDiagnoses() {
    return await Diagnosis.findAll({
        include: [
            {
                model: User,
                as: 'users',
                attributes: ['id', [literal(`"users"."name" || ' ' || "users"."surname"`), 'fullName']],
            },
            { model: Treatment, as: 'treatments' },
            {
                model: Patient,
                as: 'patient',
                attributes: ['id', [literal(`"patient"."name" || ' ' || "patient"."surname"`), 'fullName']],
            },
        ],
        nest: true,
    });
}

async function getDiagnosisPlain(uuid) {
    const diagnosis = await Diagnosis.findOne({ where: { uuid } });
    if (diagnosis === null) throw new NotFoundError('Error, diagnóstico no encontrado', { uuid });
    return diagnosis;
}

async function getDiagnosisAndTreatments(uuid) {
    const diagnosis = await Diagnosis.findOne(
        { where: { uuid } },
        { include: [{ model: Treatment, as: 'treatments' }] },
    );
    if (diagnosis === null) throw new NotFoundError('Error, diagnóstico no encontrado', { uuid });
    return diagnosis;
}

async function getDiagnosisAndUsers(uuid) {
    const diagnosis = await Diagnosis.findOne({ where: { uuid } }, { include: [{ model: User, as: 'users' }] });
    if (diagnosis === null) throw new NotFoundError('Error, diagnóstico no encontrado', { uuid });
    return diagnosis;
}

async function getDiagnosis(uuid) {
    const diagnosis = await Diagnosis.findOne(
        { where: { uuid } },
        {
            include: [
                { model: Treatment, as: 'treatments' },
                { model: User, as: 'users' },
                { model: Patient, as: 'patient' },
            ],
        },
    );
    if (diagnosis === null) throw new NotFoundError('Error, diagnóstico no encontrado', { uuid });
    return diagnosis;
}

async function getDiagnosisById(id) {
    const diagnosis = await Diagnosis.findByPk(id, {
        include: [
            { model: Treatment, as: 'treatments' },
            { model: User, as: 'users' },
        ],
    });
    if (diagnosis === null) throw new NotFoundError('Error, diagnosis no encontrado', { id });
    return diagnosis;
}

async function getDiagnosisByIdPlain(id) {
    const diagnosis = await Diagnosis.findByPk(id);
    if (diagnosis === null) throw new NotFoundError('Error, diagnosis no encontrado', { id });
    return diagnosis;
}

// Treat query as a literal string, escaping % and _ characters
const escapeLike = (str) => str.replace(/[%_]/g, '\\$&');

async function getFilteredDiagnoses(query, limit = 20) {
    if (!query || query.length < 2) {
        return [];
    }
    const safeQuery = `%${escapeLike(query)}%`;

    const diagnoses = await Diagnosis.findAll({
        attributes: ['id', 'name'],
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
    });

    return diagnoses;
}

// ===== UPDATE =====

/**
 * Updates a diagnosis's state by UUID.
 * @param {string} uuid - Diagnosis UUID
 * @param {string} newState - New state
 * @returns {Promise<number>} Number of updated rows
 */

async function updateDiagnosisState(uuid, newState) {
    const [count] = await Diagnosis.update({ state: newState }, { where: { uuid } });
    if (count === 0) throw new NotFoundError('Error, no se ha podido editar el estado del diagnóstico', { uuid });
    return count;
}

/**
 * Updates a diagnosis's record state by UUID.
 * @param {string} uuid - Diagnosis UUID
 * @param {string} newRecordState - New record state
 * @returns {Promise<number>} Number of updated rows
 */

async function updateDiagnosisRecordState(uuid, newRecordState) {
    const [count] = await Diagnosis.update({ recordState: newRecordState }, { where: { uuid } });
    if (count === 0)
        throw new NotFoundError('Error, no se han podido editar el estado del registro del diagnóstico', { uuid });
    return count;
}

module.exports = {
    createDiagnosis,

    getDiagnosesPlain,
    getDiagnosesAndTreatments,
    getDiagnosesAndUsers,
    getDiagnoses,
    getFilteredDiagnoses,

    getDiagnosis,
    getDiagnosisById,
    getDiagnosisPlain,
    getDiagnosisByIdPlain,
    getDiagnosisAndTreatments,
    getDiagnosisAndUsers,

    updateDiagnosisState,
    updateDiagnosisRecordState,
};
