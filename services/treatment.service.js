const sequelize = require('../config/database');
const TreatmentRepository = require('../repositories/treatment.repository');
const NotFoundError = require('../errors/NotFoundError');
const { throwIfNotExists } = require('../utils/error-utils');

/**
 * Creates a new treatment and associates users and diagnoses within a single transaction.
 *
 * Workflow:
 * - Creates the treatment
 * - Associates users (with roles and optional assignedAt)
 * - Associates diagnoses
 * - Returns the fully populated treatment (with relations)
 *
 * @param {Object} treatmentData - Core treatment data (name, duration, patientId, etc.)
 * @param {Array<{user: {id: number, role: string, assignedAt?: Date}}>} [users=[]] - Users to associate
 * @param {Array<{diagnosis: {id: number}}>} [diagnoses=[]] - Diagnoses to associate
 * @returns {Promise<Object>} Fully populated Treatment instance
 */
async function createTreatment(treatmentData, users = [], diagnoses = []) {
    return await sequelize.transaction(async (t) => {
        const treatment = await TreatmentRepository.create(treatmentData, { transaction: t });

        if (users.length > 0) {
            await TreatmentRepository.associateUsers(treatment, users, { transaction: t });
        }

        if (diagnoses.length > 0) {
            await TreatmentRepository.associateDiagnoses(treatment, diagnoses, { transaction: t });
        }

        return await TreatmentRepository.findByUuidDetailed(treatment.uuid, { transaction: t });
    });
}

/**
 * Retrieves all treatments with full associations (users, diagnoses, patient).
 *
 * @returns {Promise<Array<Object>>} List of treatments with relations
 */
async function getTreatments() {
    return await TreatmentRepository.findAllDetailed();
}

/**
 * Retrieves a fully detailed treatment by UUID.
 *
 * Throws if the treatment does not exist.
 *
 * @param {string} uuid - Treatment UUID
 * @returns {Promise<Object>} Fully populated Treatment instance
 * @throws {NotFoundError}
 */
async function getTreatment(uuid) {
    const treatment = await TreatmentRepository.findByUuidDetailed(uuid);
    return throwIfNotExists(treatment, 'tratamiento', { uuid });
}

/**
 * Retrieves a treatment by UUID without loading associations.
 *
 * Throws if the treatment does not exist.
 *
 * @param {string} uuid - Treatment UUID
 * @returns {Promise<Object>} Plain Treatment instance
 * @throws {NotFoundError}
 */
async function getTreatmentPlain(uuid) {
    const treatment = await TreatmentRepository.findByUuidPlain(uuid);
    return throwIfNotExists(treatment, 'tratamiento', { uuid });
}

/**
 * Searches treatments using optional filters such as patient identifier or treatment name.
 * If no filters are provided, returns a list of active diagnoses.
 *
 * @param {Object} params
 * @param {string} [params.patient] - Patient identifier (UUID).
 * @param {string} [params.name] - Treatment name (partial match).
 * @returns {Promise<Array<Object>>} List of matching treatments.
 */
async function searchTreatments({ patient, name }) {
    return TreatmentRepository.searchTreatments({ patient, name });
}

/**
 * Updates the clinical status of a treatment.
 *
 * @param {string} uuid - Treatment UUID
 * @param {string} newClinicalStatus - New clinical status (e.g. PLANNED, ONGOING, COMPLETED)
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError} If no treatment was updated
 */
async function updateTreatmentClinicalStatus(uuid, newClinicalStatus) {
    const [count] = await TreatmentRepository.updateClinicalStatus(uuid, newClinicalStatus);

    if (count === 0) {
        throw new NotFoundError('Error, no se ha podido editar el estado clínico del tratamiento', { uuid });
    }

    return count;
}

/**
 * Updates the administrative record status of a treatment.
 *
 * @param {string} uuid - Treatment UUID
 * @param {string} newStatus - New record status (e.g. VALID, VOID)
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError} If no treatment was updated
 */
async function updateTreatmentStatus(uuid, newStatus) {
    const [count] = await TreatmentRepository.updateStatus(uuid, newStatus);

    if (count === 0) {
        throw new NotFoundError('Error, no se ha podido editar el estado del registro del tratamiento', { uuid });
    }

    return count;
}

module.exports = {
    createTreatment,
    getTreatments,
    getTreatment,
    getTreatmentPlain,
    searchTreatments,
    updateTreatmentClinicalStatus,
    updateTreatmentStatus,
};
