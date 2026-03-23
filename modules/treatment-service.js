const { Treatment, TreatmentUser, User, Diagnosis, Patient } = require('../models/index');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const { Op, literal} = require('sequelize');
const sequelize = require('../config/database');

// ===== CREATE =====

/**
 * Creates a treatment and associates it with users 
 * @param {Object} treatmentData - Treatment data
 * @param {Array<Object>} users - Users associated to the treatment
 * @param {Array<Object>} diagnoses - Diagnoses associated to the treatment
 * @returns {Promise<Object>} The resulting treatment
 */

async function createTreatment(treatmentData, users, diagnoses) {
    return sequelize.transaction(async (t) => {
        const treatment = await Treatment.create({ ...treatmentData }, { transaction: t });
        console.log(users)
        console.log(diagnoses)
        await Promise.all(
            users.map(({ user }) => {
                const throughData = {
                    role: user.role,
                    ...(user.assignedAt && { assignedAt: user.assignedAt }),
                };
                return treatment.addUser(user.id, {
                    through: throughData,
                    transaction: t,
                });
            }),
        );
        await Promise.all(
            diagnoses.map(({ diagnosis }) => {
                return treatment.addDiagnosis(diagnosis.id, {transaction: t});
            }),
        );
        return treatment;
    });
}

// ===== READ =====

async function getTreatmentsPlain() {
    return await Treatment.findAll();
}

async function getTreatmentsAndUsers() {
    return await Treatment.findAll({
        include: [{ model: User, as: 'users' }],
        raw: true,
        nest: true,
    });
}
async function getTreatmentsAndDiagnoses() {
    return await Treatment.findAll({
        include: [{ model: Diagnosis, as: 'diagnoses' }],
        raw: true,
        nest: true,
    });
}

async function getTreatments() {
    return await Treatment.findAll({
        include: [
            { model: User, as: 'users', attributes: ['id', [literal(`"users"."name" || ' ' || "users"."surname"`), 'fullName']]},
            { model: Diagnosis, as: 'diagnoses' },
            { model: Patient, as: 'patient', attributes: ['id', [literal(`"patient"."name" || ' ' || "patient"."surname"`), 'fullName']]},
        ],
        nest: true,
    });
}

async function getTreatmentPlain(uuid) {
    const treatment = await Treatment.findOne({ where: { uuid } });
    if (treatment === null) throw new NotFoundError('Error, tratamiento no encontrado', { uuid });
    return treatment;
}

async function getTreatmentAndDiagnosis(uuid) {
    const treatment = await Treatment.findOne(
        { where: { uuid } },
        { include: [{ model: Diagnosis, as: 'diagnoses' }] },
    );
    if (treatment === null) throw new NotFoundError('Error, tratamiento no encontrado', { uuid });
    return treatment;
}

async function getTreatmentAndUsers(uuid) {
    const treatment = await Treatment.findOne({ where: { uuid } }, { include: [{ model: User, as: 'users' }] });
    if (treatment === null) throw new NotFoundError('Error, tratamiento no encontrado', { uuid });
    return treatment;
}

async function getTreatment(uuid) {
    const treatment = await Treatment.findOne(
        { where: { uuid } },
        {
            include: [
                { model: Diagnosis, as: 'diagnoses' },
                { model: User, as: 'users' },
                { model: Patient, as: 'patient'}
            ],
        },
    );
    if (treatment === null) throw new NotFoundError('Error, tratamiento no encontrado', { uuid });
    return treatment;
}

async function getTreatmentById(id) {
    const treatment = await Treatment.findByPk(id, {
        include: [
            { model: Diagnosis, as: 'diagnoses' },
            { model: User, as: 'users' },
        ],
    });
    if (treatment === null) throw new NotFoundError('Error, treatment no encontrado', { id });
    return treatment;
}

async function getTreatmentByIdPlain(id) {
    const treatment = await Treatment.findByPk(id);
    if (treatment === null) throw new NotFoundError('Error, treatment no encontrado', { id });
    return treatment;
}

// Treat query as a literal string, escaping % and _ characters
const escapeLike = (str) => str.replace(/[%_]/g, '\\$&');

async function getFilteredTreatments(query, limit = 20) {
    if (!query || query.length < 2) {
        return [];
    }
    const safeQuery = `%${escapeLike(query)}%`;

    const treatments = await Treatment.findAll({
        attributes: ['id', 'name'],
        where: {
            state: 'ACTIVE',
            [Op.or]: [{ name: { [Op.iLike]: safeQuery } }],
        },
        order: [['name', 'ASC']],
        limit: Math.min(limit, 50),
    });

    return treatments;
}

// ===== UPDATE =====

/**
 * Updates a treatment's state by UUID. 
 * @param {string} uuid - Treatment UUID
 * @param {string} newState - New state
 * @returns {Promise<number>} Number of updated rows
 */

async function updateTreatmentState(uuid, newState) {
    const [count] = await Treatment.update({ state: newState }, { where: { uuid } });
    if (count === 0) throw new NotFoundError('Error, no se ha podido editar el estado del tratamiento', { uuid });
    return count;
}

/**
 * Updates a treatment's record state by UUID. 
 * @param {string} uuid - Treatment UUID
 * @param {string} newRecordState - New record state
 * @returns {Promise<number>} Number of updated rows
 */

async function updateTreatmentRecordState(uuid, newRecordState) {
    const [count] = await Treatment.update({ recordState: newRecordState}, { where: { uuid } });
    if (count === 0) throw new NotFoundError('Error, no se han podido editar el estado del registro del tratamiento', { uuid });
    return count;
}

module.exports = {
    createTreatment,

    getTreatmentsPlain,
    getTreatmentsAndDiagnoses,
    getTreatmentsAndUsers,
    getTreatments,
    getFilteredTreatments,

    getTreatment,
    getTreatmentById,
    getTreatmentPlain,
    getTreatmentByIdPlain,
    getTreatmentAndDiagnosis,
    getTreatmentAndUsers,

    updateTreatmentState,
    updateTreatmentRecordState
};
