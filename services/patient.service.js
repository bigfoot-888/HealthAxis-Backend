const { v4: uuidv4 } = require('uuid');

const PatientRepository = require('../repositories/patient.repository');
const AppointmentRepository = require('../repositories/appointment.repository');
const AuditLogRepository = require('../repositories/audit-log.repository');
const { PatientFlow, FlowEvent } = require('../models/index');
const sequelize = require('../config/database');

const ClinicalDocumentRepository = require('../repositories/clinical-document.repository');
const FlowEventRepository = require('../repositories/flow-event.repository'); 
const { createSecondaryFlowEvent } = require('../utils/flow-event');

const AppError = require('../errors/AppError');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const { throwIfNotExists } = require('../utils/error-utils');
const { createPrimaryFlowEvent } = require('../utils/flow-event');

const Sequelize = require('sequelize');
const SequelizeValidationError = Sequelize.ValidationError;

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
    try {
        return await sequelize.transaction(async (t) => {
            const patient = await PatientRepository.create(
                {
                    ...patientData,
                    uuid: uuidv4(),
                    nhc: 'placeholder',
                },
                { transaction: t },
            );

            patient.nhc = createNHC(patient.id);
            await PatientRepository.save(patient, { transaction: t });

            await PatientFlow.create({ patientId: patient.id }, { transaction: t });

            await createPrimaryFlowEvent({
                patientId: patient.id,
                type: 'PATIENT',
                title: 'Paciente registrado en el sistema',
                entityId: patient.id,
                transaction: t,
            });

            await AuditLogRepository.createAuditLog({
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

    } catch (err) {
        if (err instanceof SequelizeValidationError) {
            const details = err.errors.map(e => ({
                field: e.path,
                message: e.message,
                value: e.value,
            }));

            throw new ValidationError('Error de validación', details);
        }
        throw err;
    }
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

/**
 * Creates a secondary FlowEvent for a clinical document associated to an existing event.
 *
 * Workflow:
 * - Validates parent FlowEvent
 * - Validates ClinicalDocument existence
 * - Creates secondary FlowEvent (CLINICAL_DOCUMENT)
 * - Creates AuditLog entry
 *
 * @param {number} parentEventId - ID of the parent FlowEvent
 * @param {number} clinicalDocumentId - ID of the ClinicalDocument to associate
 * @param {number} userId - ID of the user performing the action
 * @returns {Promise<Object>} Created FlowEvent
 * @throws {NotFoundError} If parent event or document does not exist
 */
async function createSecondaryNode(parentEventId, clinicalDocumentId, userId) {
    return await sequelize.transaction(async (t) => {
        // 1. Get parent event
        const parentEvent = await FlowEvent.findByPk(parentEventId, { transaction: t });
        throwIfNotExists(parentEvent, 'evento de flujo', { parentEventId });

        // 2. Get clinical document
        const clinicalDocument = await ClinicalDocumentRepository.findByIdPlain(clinicalDocumentId, { transaction: t });
        throwIfNotExists(clinicalDocument, 'documento clínico', { clinicalDocumentId });

        // 3. Create secondary flow event
        const flowEvent = await createSecondaryFlowEvent({
            patientId: parentEvent.patientFlowId
                ? (await PatientFlow.findByPk(parentEvent.patientFlowId, { transaction: t })).patientId
                : null,
            type: 'CLINICAL_DOCUMENT',
            title: clinicalDocument.title ?? 'Documento clínico',
            entityId: clinicalDocument.id,
            parentId: parentEvent.id,
            transaction: t,
        });
        
        return flowEvent;
    });
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
 * Retrieves a patient by DNI (plain).
 *
 * @param {string} dni
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getPatientByDni(dni) {
    const patient = await PatientRepository.findByDni(dni);
    return patient;
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
 * Retrieves a patient's history through its audit logs.
 *
 * Workflow:
 * - Validates patient existence
 * - Retrieves audit logs linked to the patient
 * - Orders logs by creation date (most recent first)
 *
 * @param {string} uuid - Patient UUID
 * @returns {Promise<Array<Object>>} List of audit logs
 * @throws {NotFoundError} If patient does not exist
 */
async function getPatientHistory(uuid) {
    const patient = await PatientRepository.findByUuidPlain(uuid);
    throwIfNotExists(patient, 'paciente', { uuid });

    const logs = await AuditLogRepository.findByPatientId(patient.id);

    return logs;
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
        CLINICAL_DOCUMENT: [],
    };

    for (const event of events) {
        if (event.entityId && groupedIds[event.type]) {
            groupedIds[event.type].push(event.entityId);
        }
    }

    // CAMBIAR Y MOVER LAS FUNCS A LOS REPOS CORRESPONDIENTES
    const [appointments, diagnoses, treatments, documents] = await Promise.all([
        groupedIds.APPOINTMENT.length ? PatientRepository.findAppointmentsByIds(groupedIds.APPOINTMENT) : [],
        groupedIds.DIAGNOSIS.length ? PatientRepository.findDiagnosesByIds(groupedIds.DIAGNOSIS) : [],
        groupedIds.TREATMENT.length ? PatientRepository.findTreatmentsByIds(groupedIds.TREATMENT) : [],
        groupedIds.CLINICAL_DOCUMENT.length ? ClinicalDocumentRepository.findByIds(groupedIds.CLINICAL_DOCUMENT) : [],
    ]);

    const appointmentMap = Object.fromEntries(appointments.map((a) => [a.id, a]));
    const diagnosisMap = Object.fromEntries(diagnoses.map((d) => [d.id, d]));
    const treatmentMap = Object.fromEntries(treatments.map((t) => [t.id, t]));
    const documentMap = Object.fromEntries(documents.map((d) => [d.id, d]));

    const nodes = events.map((event) => {
        let entity = null;

        switch (event.type) {
            case 'APPOINTMENT':
                entity = appointmentMap[event.entityId] ?? null;
                break;
            case 'DIAGNOSIS':
                entity = diagnosisMap[event.entityId] ?? null;
                break;
            case 'TREATMENT':
                entity = treatmentMap[event.entityId] ?? null;
                break;
            case 'PATIENT':
                entity = patient;
                break;
            case 'CLINICAL_DOCUMENT':
                entity = documentMap[event.entityId] ?? null;
                break;
            default:
                entity = null;
        }

        return {
            id: String(event.id),
            type: event.type,
            data: {
                title: event.title,
                type: event.type,
                role: event.role,
                entityId: event.entityId ?? null,
                entity,
                date: event.date,
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
            type: 'smoothstep',
            sourceHandle: event.role === 'SECONDARY' ? 'bottom' : 'right',
            targetHandle: event.role === 'SECONDARY' ? 'top' : 'left',
        }));

    return {
        flowId: flow.id,
        nodes,
        edges,
    };
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

        const activeAppointments = await AppointmentRepository.hasActiveAppointmentsByPatientId(patient.id, {
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
            type: 'PATIENT',
            title: 'Paciente dado de baja',
            entityId: patient.id,
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
            type: 'PATIENT',
            title: 'Paciente reactivado en el sistema',
            entityId: patient.id,
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

// ===== DELETES =====


/**
 * Deletes a secondary FlowEvent from the patient flow.
 *
 * Workflow:
 * - Validates FlowEvent existence
 * - Ensures it is a SECONDARY node (safety)
 * - Deletes FlowEvent (edges removed via cascade)
 *
 * @param {number} id - FlowEvent ID
 * @param {number} userId - ID of the user performing the action
 * @returns {Promise<number>} Number of deleted rows
 * @throws {NotFoundError} If FlowEvent does not exist
 */
async function deleteFlowEvent(id) {
    return await sequelize.transaction(async (t) => {
        const event = await FlowEventRepository.findById(id, { transaction: t });
        throwIfNotExists(event, 'evento de flujo', { id });

        if (event.role !== 'SECONDARY') {
            throw new Error('Solo se pueden eliminar nodos secundarios');
        }

        const count = await FlowEventRepository.deleteById(id, { transaction: t });

        return count;
    });
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
    getPatientByDni,
    deactivatePatient,
    reactivatePatient,
    updatePatient,
    getPatientHistory,
    deleteFlowEvent,
    ensurePatientIsActive,
    createSecondaryNode,
};
