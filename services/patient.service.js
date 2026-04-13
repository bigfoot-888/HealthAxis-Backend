const { v4: uuidv4 } = require('uuid');

const PatientRepository = require('../repositories/patient.repository');
const AppointmentRepository = require('../repositories/appointment.repository');
const { PatientFlow } = require('../models/index');
const sequelize = require('../config/database');

const AppError = require('../errors/AppError');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError'); 

const { throwIfNotExists } = require('../utils/error-utils');
const { createPrimaryFlowEvent } = require('../utils/flow-event');
const { createAuditLog } = require('../repositories/audit-log.repository');

function createNHC(id) {
    return `${String(id).padStart(6, '0')}`;
}

// ===== CREATE =====

/**
 * Creates a new patient and initializes all related system entities.
 *
 * Workflow:
 * - Generates UUID and creates patient
 * - Generates and assigns NHC
 * - Creates PatientFlow
 * - Creates initial REGISTRATION FlowEvent
 * - Creates AuditLog entry
 *
 * @param {Object} patientData - Core patient data
 * @param {number} [userId=1] - ID of the user performing the action
 * @returns {Promise<Object>} Created patient (plain)
 */
async function createPatient(patientData, userId = 1) {
    return await sequelize.transaction(async (t) => {
        const patient = await PatientRepository.create(
            {
                ...patientData,
                uuid: uuidv4(),
                nhc: '',
            },
            { transaction: t },
        );

        patient.nhc = createNHC(patient.id);
        await PatientRepository.save(patient, { transaction: t });

        await PatientFlow.create({ patientId: patient.id }, { transaction: t });

        await createPrimaryFlowEvent({
            patientId: patient.id,
            type: 'REGISTRATION',
            title: 'Paciente registrado en el sistema',
            transaction: t,
        });

        await createAuditLog({
            action: 'CREATED',
            entityType: 'PATIENT',
            entityId: patient.id,
            userId,
            patientId: patient.id,
            meta: { nhc: patient.nhc },
            transaction: t,
        });

        return await PatientRepository.findByUuidPlain(patient.uuid, { transaction: t });
    });
}

/**
 * Bulk imports patients into the system.
 *
 * Adds UUIDs to each patient before insertion.
 *
 * @param {Array<Object>} patients - Array of patient objects
 * @returns {Promise<Array<Object>>} Inserted patients with UUIDs
 * @throws {AppError} If insertion fails
 */
async function importPatients(patients) {
    try {
        const patientsWithUuid = patients.map((patient) => ({
            ...patient,
            uuid: uuidv4(),
        }));

        await PatientRepository.bulkCreate(patientsWithUuid);
        return patientsWithUuid;
    } catch (err) {
        throw new AppError('Error al procesar los pacientes importados', 500, {
            originalMessage: err.message,
        });
    }
}

// ===== READ =====

/**
 * Retrieves all patients without associations.
 *
 * @returns {Promise<Array<Object>>}
 */
async function getPatients() {
    return await PatientRepository.findAllPlain();
}

/**
 * Searches active patients by name, surname, or NHC.
 *
 * @param {string} query - Search string
 * @param {number} [limit=20] - Maximum number of results
 * @returns {Promise<Array<Object>>}
 */
async function getFilteredPatients(query, limit = 20) {
    return await PatientRepository.searchFiltered(query, limit);
}

/**
 * Retrieves a patient by UUID (plain).
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getPatient(uuid) {
    const patient = await PatientRepository.findByUuidPlain(uuid);
    return throwIfNotExists(patient, 'paciente', { uuid });
}

/**
 * Retrieves a patient by ID (plain).
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getPatientById(id) {
    const patient = await PatientRepository.findByIdPlain(id);
    return throwIfNotExists(patient, 'paciente', { id });
}

/**
 * Retrieves a patient by UUID with full associations.
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getPatientDetail(uuid) {
    const patient = await PatientRepository.findByUuidDetailed(uuid);
    return throwIfNotExists(patient, 'paciente', { uuid });
}

/**
 * Searches patients using optional filters such as identifier or name.
 * If no filters are provided, returns a list of active patients.
 *
 * @param {Object} params
 * @param {string} [params.identifier] - Patient identifier (NHC or DNI).
 * @param {string} [params.name] - Patient name or surname (partial match).
 * @returns {Promise<Array<Object>>} List of matching patients.
 */
async function searchPatients({ identifier, name }) {
    return PatientRepository.searchPatients({ identifier, name });
}

/**
 * Builds the patient flow graph structure (nodes and edges).
 *
 * Workflow:
 * - Fetches patient and flow
 * - Groups FlowEvents by entity type
 * - Fetches related entities (appointments, diagnoses, treatments)
 * - Constructs graph nodes and edges for UI consumption
 *
 * @param {string} uuid - Patient UUID
 * @returns {Promise<{flowId: number, nodes: Array, edges: Array}>}
 * @throws {NotFoundError}
 */
async function getPatientFlow(uuid) {
    const patient = await PatientRepository.findByUuidPlain(uuid);

    if (!patient) {
        throw new NotFoundError('Paciente no encontrado', { uuid });
    }

    const flow = await PatientRepository.findFlowByPatientId(patient.id);

    if (!flow) {
        throw new NotFoundError('Flujo de paciente no encontrado', { patientId: patient.id });
    }

    const events = flow.events || [];
    const groupedIds = {
        APPOINTMENT: [],
        DIAGNOSIS: [],
        TREATMENT: [],
    };

    events.forEach((event) => {
        if (event.entityId && groupedIds[event.type]) {
            groupedIds[event.type].push(event.entityId);
        }
    });

    const [appointments, diagnoses, treatments] = await Promise.all([
        PatientRepository.findAppointmentsByIds(groupedIds.APPOINTMENT),
        PatientRepository.findDiagnosesByIds(groupedIds.DIAGNOSIS),
        PatientRepository.findTreatmentsByIds(groupedIds.TREATMENT),
    ]);

    const appointmentMap = Object.fromEntries(appointments.map((a) => [a.id, a]));
    const diagnosisMap = Object.fromEntries(diagnoses.map((d) => [d.id, d]));
    const treatmentMap = Object.fromEntries(treatments.map((t) => [t.id, t]));

    const nodes = events.map((event) => {
        let entity = null;

        if (event.type === 'APPOINTMENT') entity = appointmentMap[event.entityId];
        else if (event.type === 'DIAGNOSIS') entity = diagnosisMap[event.entityId];
        else if (event.type === 'TREATMENT') entity = treatmentMap[event.entityId];

        return {
            id: String(event.id),
            type: event.type,
            data: {
                label: event.title,
                type: event.type,
                role: event.role,
                entity,
            },
            position: {
                x: event.positionX ?? 0,
                y: event.positionY ?? 0,
            },
        };
    });

    const edges = events
        .filter((event) => event.parentEventId)
        .map((event) => ({
            id: `e-${event.parentEventId}-${event.id}`,
            source: String(event.parentEventId),
            target: String(event.id),
            type: event.role === 'PRIMARY' ? 'smoothstep' : 'default',
        }));

    return { flowId: flow.id, nodes, edges };
}

// ===== UPDATE =====

/**
 * Deactivates a patient and creates a corresponding flow event.
 *
 * @param {number} uuid - Patient UUID
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError}
 */
async function deactivatePatient(uuid) {
    return await sequelize.transaction(async (t) => {
        const patient = await PatientRepository.findByUuidPlain(uuid, { transaction: t });
        if (!patient) {
            throw new NotFoundError('Paciente no encontrado', { uuid });
        }

        const activeAppointments = await AppointmentRepository.hasActiveAppointmentsByUserId(patient.id, {
            transaction: t,
        });

        if (activeAppointments) {
            throw new ValidationError('No se puede dar de baja a un usuario con citas activas.', 400, {
                activeAppointments,
            });
        }

        const [count] = await PatientRepository.updateStatusById(patient.id, 'INACTIVE', { transaction: t });

        if (count === 0) {
            throw new NotFoundError('Error, el paciente no ha podido ser desactivado', { patientId: patient.id, uuid });
        }

        await createPrimaryFlowEvent({
            patientId: patient.id,
            type: 'DEACTIVATION',
            title: 'Paciente dado de baja',
            transaction: t,
        });

        return count;
    });
}

/**
 * Reactivates a patient and creates a corresponding flow event.
 *
 * @param {number} uuid - Patient UUID
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError}
 */
async function reactivatePatient(uuid) {
    return await sequelize.transaction(async (t) => {
        const patient = await PatientRepository.findByUuidPlain(uuid, { transaction: t });

        if (!patient) {
            throw new NotFoundError('Paciente no encontrado', { uuid });
        }

        const [count] = await PatientRepository.updateStatusById(patient.id, 'ACTIVE', { transaction: t });

        if (count === 0) {
            throw new NotFoundError('Error, el paciente no ha podido ser reactivado', { patientId: patient.id, uuid });
        }

        await createPrimaryFlowEvent({
            patientId: patient.id,
            type: 'REACTIVATION',
            title: 'Paciente reactivado en el sistema',
            transaction: t,
        });

        return count;
    });
}

/**
 * Updates patient data by UUID.
 *
 * @param {string} uuid - Patient UUID
 * @param {Object} patientData - Fields to update
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError}
 */
async function updatePatient(uuid, patientData) {
    const [count] = await PatientRepository.updateByUuid(uuid, patientData);

    if (count === 0) {
        throw new NotFoundError('Error, no se han podido editar los datos del paciente', { uuid });
    }

    return count;
}

// ===== GUARDS =====

function ensurePatientIsActive(patient) {
    if (patient.status !== 'ACTIVE') {
        throw new ValidationError('El paciente está dado de baja.');
    }
}

module.exports = {
    createPatient,
    importPatients,
    searchPatients,
    getPatients,
    getFilteredPatients,
    getPatient,
    getPatientById,
    getPatientDetail,
    getPatientFlow,
    deactivatePatient,
    reactivatePatient,
    updatePatient,

    ensurePatientIsActive,
};
