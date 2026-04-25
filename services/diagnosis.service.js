const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const DiagnosisRepository = require('../repositories/diagnosis.repository');
const AppointmentRepository = require('../repositories/appointment.repository');
const PatientRepository = require('../repositories/patient.repository');
const AuditLogRepository = require('../repositories/audit-log.repository');

const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');
const { throwIfNotExists } = require('../utils/error-utils');

const { createPrimaryFlowEvent } = require('../utils/flow-event');

// ===== CREATE =====

/**
 * Creates a diagnosis and associates users.
 *
 * Workflow:
 * - Creates diagnosis with UUID
 * - Associates users with roles
 * - Creates flow event
 *
 * @param {Object} diagnosisData
 * @param {Array<{userId: number, role: string}>} users
 * @returns {Promise<Object>}
 */
async function createDiagnosis(diagnosisData, users = [], userId) {
    return await sequelize.transaction(async (t) => {
        // Patient exists
        const patient = await PatientRepository.findByIdPlain(diagnosisData.patientId, { transaction: t });
        throwIfNotExists(patient, 'paciente', { id: diagnosisData.patientId });

        // Appointment exists
        if (diagnosisData.appointmentId) {
            const appointment = await AppointmentRepository.findById(diagnosisData.appointmentId, { transaction: t });
            throwIfNotExists(appointment, 'cita', { id: diagnosisData.appointmentId });

            // Check for inconsistencies
            if (appointment.patientId !== diagnosisData.patientId)
                throw new ValidationError('La cita no pertenece al paciente');
        }

        // At least one user
        if (!users || users.length === 0) throw new ValidationError('Debe haber al menos un profesional');

        // No duplicates
        const userIds = users.map((u) => u.userId);
        const uniqueUserIds = new Set(userIds);
        if (uniqueUserIds.size !== userIds.length) throw new ValidationError('No puede haber usuarios duplicados');

        // Users exist
        for (const u of users) {
            const user = await UserRepository.findById(u.userId, { transaction: t });
            throwIfNotExists(user, 'usuario');
        }

        const validRoles = ['AUTHOR', 'REVIEWER', 'VALIDATOR', 'CONTRIBUTOR'];

        // Valid role
        for (const u of users) {
            if (!validRoles.includes(u.role)) {
                throw new ValidationError(`Rol inválido: ${u.role}`);
            }
        }

        // Date inconsistencies
        if (diagnosisData.resolvedAt && diagnosisData.diagnosedAt) {
            if (new Date(diagnosisData.resolvedAt) < new Date(diagnosisData.diagnosedAt)) {
                throw new ValidationError('La fecha de resolución no puede ser anterior al diagnóstico', {
                    resolvedAt: diagnosisData.resolvedAt,
                    diagnosedAt: diagnosisData.diagnosedAt,
                });
            }
        }

        const diagnosis = await DiagnosisRepository.create({ ...diagnosisData, uuid: uuidv4() }, { transaction: t });

        await DiagnosisRepository.associateUsers(diagnosis, users, { transaction: t });

        await createPrimaryFlowEvent({
            patientId: diagnosis.patientId,
            type: 'DIAGNOSIS',
            title: 'Diagnóstico registrado en el sistema',
            entityId: diagnosis.id,
            transaction: t,
        });

        await AuditLogRepository.createAuditLog({
            action: 'CREATED',
            entityType: 'DIAGNOSIS',
            entityId: diagnosis.id,
            userId,
            patientId: diagnosis.patientId,
            meta: {
                appointmentId: diagnosis.appointmentId,
            },
            transaction: t,
        });

        return diagnosis;
    });
}

// ===== READ =====

/**
 * Retrieves all diagnoses with optional filters.
 *
 * @param {Object} query
 * @param {string} [query.patientUuid]
 * @returns {Promise<Array<Object>>}
 */
async function getDiagnoses(query = {}) {
    const { patientUuid, appointmentUuid } = query;
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

    return await DiagnosisRepository.findAll({ where });
}

/**
 * Retrieves diagnoses without associations.
 *
 * @returns {Promise<Array<Object>>}
 */
async function getDiagnosesPlain() {
    return await DiagnosisRepository.findAllPlain();
}

/**
 * Retrieves a diagnosis by UUID with associations.
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getDiagnosis(uuid) {
    const diagnosis = await DiagnosisRepository.findByUuid(uuid);
    return throwIfNotExists(diagnosis, 'diagnóstico', { uuid });
}

/**
 * Retrieves a diagnosis by UUID without associations.
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getDiagnosisPlain(uuid) {
    const diagnosis = await DiagnosisRepository.findByUuidPlain(uuid);
    return throwIfNotExists(diagnosis, 'diagnóstico', { uuid });
}

/**
 * Searches diagnoses by name or patient.
 *
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array<Object>>}
 */
async function getFilteredDiagnoses(query, limit = 20) {
    return await DiagnosisRepository.searchFiltered(query, limit);
}

/**
 * Searches diagnoses using optional filters such as patient identifier or diagnosis name.
 * If no filters are provided, returns a list of active diagnoses.
 *
 * @param {Object} params
 * @param {string} [params.patient] - Patient identifier (UUID).
 * @param {string} [params.name] - Diagnosis name (partial match).
 * @returns {Promise<Array<Object>>} List of matching diagnoses.
 */
async function searchDiagnoses({ patient, name }) {
    return DiagnosisRepository.searchDiagnoses({ patient, name });
}

// ===== UPDATE =====

/**
 * Updates clinical status of a diagnosis.
 *
 * @param {string} uuid
 * @param {string} clinicalStatus
 * @param {string} userId
 * @returns {Promise<number>}
 * @throws {NotFoundError}
 */
async function updateDiagnosisClinicalStatus(uuid, clinicalStatus, userId) {
    return await sequelize.transaction(async (t) => {
        const diagnosis = await DiagnosisRepository.findByUuidPlain(uuid, { transaction: t });
        throwIfNotExists(diagnosis, 'diagnóstico', { uuid });

        const previousClinicalStatus = diagnosis.clinicalStatus;

        const [count] = await DiagnosisRepository.updateClinicalStatusByUuid(uuid, clinicalStatus, { transaction: t });

        if (count === 0) {
            throw new NotFoundError('No se ha podido actualizar el estado clínico del diagnóstico', { uuid });
        }

        if (clinicalStatus !== previousClinicalStatus) {
            await AuditLogRepository.createAuditLog({
                action: 'CLINICAL_STATUS_CHANGED',
                entityType: 'DIAGNOSIS',
                entityId: diagnosis.id,
                userId,
                patientId: diagnosis.patientId,
                meta: {
                    previousClinicalStatus,
                    newClinicalStatus: clinicalStatus,
                },
                transaction: t,
            });
        }

        const relevantStatuses = ['RESOLVED', 'RULED_OUT'];

        if (clinicalStatus !== previousClinicalStatus && relevantStatuses.includes(clinicalStatus)) {
            let title = '';

            switch (clinicalStatus) {
                case 'RESOLVED':
                    title = 'Diagnóstico resuelto';
                    break;
                case 'INACTIVE':
                    title = 'Diagnóstico descartado';
                    break;
            }

            await createPrimaryFlowEvent({
                patientId: diagnosis.patientId,
                type: 'DIAGNOSIS',
                title,
                entityId: diagnosis.id,
                transaction: t,
            });
        }

        return count;
    });
}

/**
 * Updates record/system status of a diagnosis.
 *
 * @param {string} uuid
 * @param {string} status
 * @param {string} userId
 * @returns {Promise<number>}
 * @throws {NotFoundError}
 */
async function updateDiagnosisRecordStatus(uuid, status, userId) {
    return await sequelize.transaction(async (t) => {
        const diagnosis = await DiagnosisRepository.findByUuidPlain(uuid, { transaction: t });
        throwIfNotExists(diagnosis, 'diagnóstico', { uuid });

        const previousStatus = diagnosis.status;

        const [count] = await DiagnosisRepository.updateRecordStatusByUuid(uuid, status, { transaction: t });

        if (count === 0) {
            throw new NotFoundError('No se ha podido actualizar el estado del diagnóstico', { uuid });
        }

        if (status !== previousStatus) {
            await AuditLogRepository.createAuditLog({
                action: 'STATUS_CHANGED',
                entityType: 'DIAGNOSIS',
                entityId: diagnosis.id,
                userId,
                patientId: diagnosis.patientId,
                meta: {
                    previousStatus,
                    newStatus: status,
                },
                transaction: t,
            });
        }

        return count;
    });
}
module.exports = {
    createDiagnosis,

    getDiagnoses,
    getDiagnosesPlain,
    getDiagnosis,
    getDiagnosisPlain,
    getFilteredDiagnoses,
    searchDiagnoses,

    updateDiagnosisClinicalStatus,
    updateDiagnosisRecordStatus,
};
