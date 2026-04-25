const sequelize = require('../config/database');
const TreatmentRepository = require('../repositories/treatment.repository');
const PatientRepository = require('../repositories/patient.repository');
const DiagnosisRepository = require('../repositories/diagnosis.repository');
const AppointmentRepository = require('../repositories/appointment.repository');
const AuditLogRepository = require('../repositories/audit-log.repository');
const NotFoundError = require('../errors/NotFoundError');
const { throwIfNotExists } = require('../utils/error-utils');
const {createPrimaryFlowEvent} = require('../utils/flow-event')

/**
 * Creates a new treatment and associates users and diagnoses within a single transaction.
 *
 * Workflow:
 * - Creates the treatment
 * - Associates users (with roles and optional assignedAt)
 * - Returns the fully populated treatment (with relations)
 *
 * @param {Object} treatmentData - Core treatment data (name, duration, patientId, etc.)
 * @param {Array<{user: {id: number, role: string, assignedAt?: Date}}>} [users=[]] - Users to associate
 * @param {string} userId
 * @returns {Promise<Object>} Fully populated Treatment instance
 */
async function createTreatment(treatmentData, users = [], userId) {
    return await sequelize.transaction(async (t) => {
        const treatment = await TreatmentRepository.create(treatmentData, { transaction: t });

        if (users.length > 0) {
            await TreatmentRepository.associateUsers(treatment, users, { transaction: t });
        }

        await createPrimaryFlowEvent({
            patientId: treatment.patientId,
            type: 'TREATMENT',
            title: 'Tratamiento registrado en el sistema',
            entityId: treatment.id,
            transaction: t,
        });

        await AuditLogRepository.createAuditLog({
            action: 'CREATED',
            entityType: 'TREATMENT',
            entityId: treatment.id,
            userId,
            patientId: treatment.patientId,
            meta: {
                diagnosisId: treatment.diagnosisId,
                appointmentId: treatment.appointmentId,
            },
            transaction: t,
        });

        return await TreatmentRepository.findByUuidDetailed(treatment.uuid, { transaction: t });
    });
}

/**
 * Retrieves treatments with optional filters.
 *
 * @param {Object} query
 * @param {string} [query.patientUuid]
 * @returns {Promise<Array<Object>>}
 */
async function getTreatments(query = {}) {
    const { patientUuid, appointmentUuid, diagnosisUuid } = query;

    const where = {};

    if (patientUuid) {
        const patient = await PatientRepository.findByUuidPlain(patientUuid);
        throwIfNotExists(patient, 'paciente', { patientUuid });
        where.patientId = patient.id;
    }
    if (appointmentUuid) {
        const appointment = await AppointmentRepository.findByUuidPlain(appointmentUuid);
        throwIfNotExists(appointment, 'cita', { appointmentUuid });
        where.appointmentId = appointment.id;
    }
    if (diagnosisUuid) {
        const diagnosis = await DiagnosisRepository.findByUuidPlain(diagnosisUuid);
        throwIfNotExists(diagnosis, 'diagnóstico', { diagnosisUuid });
        where.diagnosisId = diagnosis.id;
    }

    return await TreatmentRepository.findAll({ where });
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
 * @param {string} userId
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError} If no treatment was updated
 */
async function updateTreatmentClinicalStatus(uuid, newClinicalStatus, userId) {
    return await sequelize.transaction(async (t) => {
        const treatment = await TreatmentRepository.findByUuidPlain(uuid, { transaction: t });
        throwIfNotExists(treatment, 'tratamiento', { uuid });

        const previousClinicalStatus = treatment.clinicalStatus;

        const [count] = await TreatmentRepository.updateClinicalStatus(uuid, newClinicalStatus, { transaction: t });

        if (count === 0) {
            throw new NotFoundError('Error, no se ha podido editar el estado clínico del tratamiento', { uuid });
        }

        if (newClinicalStatus !== previousClinicalStatus) {
            await AuditLogRepository.createAuditLog({
                action: 'CLINICAL_STATUS_CHANGED',
                entityType: 'TREATMENT',
                entityId: treatment.id,
                userId,
                patientId: treatment.patientId,
                meta: {
                    previousClinicalStatus,
                    newClinicalStatus,
                },
                transaction: t,
            });
        }

        const relevantStatuses = ['COMPLETED', 'DISCONTINUED'];

        if (newClinicalStatus !== previousClinicalStatus && relevantStatuses.includes(newClinicalStatus)) {
            let title = '';

            switch (newClinicalStatus) {
                case 'COMPLETED':
                    title = 'Tratamiento completado';
                    break;
                case 'DISCONTINUED':
                    title = 'Tratamiento interrumpido';
                    break;
            }

            await createPrimaryFlowEvent({
                patientId: treatment.patientId,
                type: 'TREATMENT',
                title,
                entityId: treatment.id,
                transaction: t,
            });
        }

        return count;
    });
}

/**
 * Updates the administrative record status of a treatment.
 *
 * @param {string} uuid - Treatment UUID
 * @param {string} newStatus - New record status (e.g. VALID, VOID)
 * @param {string} userId
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError} If no treatment was updated
 */
async function updateTreatmentStatus(uuid, newStatus, userId) {
    return await sequelize.transaction(async (t) => {
        const treatment = await TreatmentRepository.findByUuidPlain(uuid, { transaction: t });
        throwIfNotExists(treatment, 'tratamiento', { uuid });

        const previousStatus = treatment.status;

        const [count] = await TreatmentRepository.updateStatus(uuid, newStatus, { transaction: t });

        if (count === 0) {
            throw new NotFoundError('Error, no se ha podido editar el estado del registro del tratamiento', { uuid });
        }

        if (newStatus !== previousStatus) {
            await AuditLogRepository.createAuditLog({
                action: 'STATUS_CHANGED',
                entityType: 'TREATMENT',
                entityId: treatment.id,
                userId,
                patientId: treatment.patientId,
                meta: {
                    previousStatus,
                    newStatus,
                },
                transaction: t,
            });
        }

        return count;
    });
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
