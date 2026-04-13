const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const DiagnosisRepository = require('../repositories/diagnosis.repository');
const AppointmentRepository = require('../repositories/appointment.repository')
const PatientRepository = require('../repositories/patient.repository');

const NotFoundError = require('../errors/NotFoundError');
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
async function createDiagnosis(diagnosisData, users = []) {
    return await sequelize.transaction(async (t) => {
        const diagnosis = await DiagnosisRepository.create(
            {
                ...diagnosisData,
                uuid: uuidv4(),
            },
            { transaction: t },
        );

        if (users.length > 0) {
            await DiagnosisRepository.associateUsers(diagnosis, users, { transaction: t });
        }

        await createPrimaryFlowEvent({
            patientId: diagnosis.patientId,
            type: 'DIAGNOSIS',
            title: 'Diagnóstico registrado en el sistema',
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

    console.log(where)

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
 * @returns {Promise<number>}
 * @throws {NotFoundError}
 */
async function updateDiagnosisClinicalStatus(uuid, clinicalStatus) {
    const [count] = await DiagnosisRepository.updateClinicalStatusByUuid(uuid, clinicalStatus);

    if (count === 0) {
        throw new NotFoundError('No se ha podido actualizar el estado clínico del diagnóstico', { uuid });
    }

    return count;
}

/**
 * Updates record/system status of a diagnosis.
 *
 * @param {string} uuid
 * @param {string} status
 * @returns {Promise<number>}
 * @throws {NotFoundError}
 */
async function updateDiagnosisRecordStatus(uuid, status) {
    const [count] = await DiagnosisRepository.updateRecordStatusByUuid(uuid, status);

    if (count === 0) {
        throw new NotFoundError('No se ha podido actualizar el estado del diagnóstico', { uuid });
    }

    return count;
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
