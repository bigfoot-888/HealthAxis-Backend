const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const AppointmentRepository = require('../repositories/appointment.repository');
const UserRepository = require('../repositories/user.repository');
const PatientRepository = require('../repositories/patient.repository');
const DiagnosisRepository = require('../repositories/diagnosis.repository');
const TreatmentRepository = require('../repositories/treatment.repository');

const { ensurePatientIsActive } = require('../services/patient.service');
const { ensureUserIsActive } = require('../services/user.service');

const { throwIfNotExists } = require('../utils/error-utils');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');

const { createPrimaryFlowEvent } = require('../utils/flow-event');

// ===== CREATE =====

/**
 * Creates an appointment and generates its corresponding flow event.
 *
 * Workflow:
 * - Creates appointment with UUID
 * - Checks whether the involved patient and user are active
 * - Creates flow event linked to the patient
 *
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<Object>} Created appointment
 */
async function createAppointment(appointmentData) {
    return await sequelize.transaction(async (t) => {
        const patient = await PatientRepository.findByIdPlain(appointmentData.patientId);
        throwIfNotExists(patient, 'paciente', { patientId: appointmentData.patientId });
        ensurePatientIsActive(patient);

        const user = await UserRepository.findById(appointmentData.userId);
        throwIfNotExists(user, 'usuario', { userId: appointmentData.userId });
        ensureUserIsActive(user);

        const appointment = await AppointmentRepository.create(
            {
                ...appointmentData,
                agendaId: user.agendaId,
                uuid: uuidv4(),
            },
            { transaction: t },
        );

        await createPrimaryFlowEvent({
            patientId: appointment.patientId,
            type: 'APPOINTMENT',
            title: 'Cita registrada en el sistema',
            transaction: t,
        });

        return appointment;
    });
}

async function completeAppointmentWithClinicalData(uuid, clinicalData) {
    return await sequelize.transaction(async (t) => {
        const appointment = await AppointmentRepository.findByUuid(uuid);
        throwIfNotExists(appointment, 'cita', { uuid });

        if (appointment.status !== 'CHECKED_IN') {
            throw new ConflictError('La cita no puede completarse en su estado actual');
        }

        const diagnosis = await DiagnosisRepository.create(
            {
                ...clinicalData.diagnosis,
                patientId: appointment.patientId,
                appointmentId: appointment.id,
            },
            { transaction: t },
        );

        let treatments = [];
        if (clinicalData.treatments?.length) {
            treatments = await TreatmentRepository.bulkCreate(
                clinicalData.treatments.map((treatment) => ({
                    ...treatment,
                    patientId: appointment.patientId,
                    diagnosisId: diagnosis.id,
                    appointmentId: appointment.id,
                })),
                { transaction: t },
            );
        }

        // Associate diagnosis to user
        await DiagnosisRepository.associateUsers(diagnosis, [{ user: { id: appointment.userId, role: 'AUTHOR' } }], {
            transaction: t,
        });

        // Associate treatments to user
        await Promise.all(
            treatments.map((treatment) =>
                TreatmentRepository.associateUsers(treatment, [{ user: { id: appointment.userId, role: 'AUTHOR' } }], {
                    transaction: t,
                }),
            ),
        );

        await AppointmentRepository.updateByUuid(appointment.uuid, { status: 'COMPLETED' }, { transaction: t });

        // await createPrimaryFlowEvent({
        //     patientId: appointment.patientId,
        //     type: 'CLINICAL_DATA',
        //     title: 'Datos clínicos registrados y cita completada',
        //     transaction: t,
        // });
        return {
            diagnosis,
            treatments,
        };
    });
}

// ===== READ =====

/**
 * Retrieves appointments with optional filters.
 *
 * @param {Object} query
 * @param {string} [query.patientUuid]
 * @returns {Promise<Array<Object>>}
 */
async function getAppointments(query = {}) {
    const { patientUuid, userUuid } = query;

    const where = {};

    if (patientUuid) {
        const patient = await PatientRepository.findByUuidPlain(patientUuid);
        throwIfNotExists(patient, 'paciente', { patientUuid });
        where.patientId = patient.id;
    }
    if (userUuid) {
        const user = await UserRepository.findByUuidPlain(userUuid);
        throwIfNotExists(user, 'usuario', { userUuid });
        where.userId = user.id;
    }

    return await AppointmentRepository.findAll({ where });
}

/**
 * Retrieves an appointment by UUID with associations.
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 */
async function getAppointment(uuid) {
    const appointment = await AppointmentRepository.findByUuid(uuid);
    return throwIfNotExists(appointment, 'cita', { uuid });
}

/**
 * Retrieves an appointment by UUID without associations.
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 */
async function getAppointmentPlain(uuid) {
    const appointment = await AppointmentRepository.findByUuidPlain(uuid);
    return throwIfNotExists(appointment, 'cita', { uuid });
}

/**
 * Searches appointments by user or patient name.
 *
 * @param {string} query - Search string
 * @param {number} [limit=20]
 * @returns {Promise<Array<Object>>}
 */
async function getFilteredAppointments(query, limit = 20) {
    return await AppointmentRepository.searchFiltered(query, limit);
}

/**
 * Searches appointments using optional filters such as practitioner or patient UUID.
 * If no filters are provided, returns a list of active patients.
 *
 * @param {Object} params
 * @param {string} [params.patient] - Patient UUID.
 * @param {string} [params.practitioner] - Practitioner UUID.
 * @returns {Promise<Array<Object>>} List of matching appointments.
 */
async function searchAppointments({ patient, practitioner }) {
    return AppointmentRepository.searchAppointments({ patient, practitioner });
}

// ===== UPDATE =====

/**
 * Updates appointment data by UUID.
 *
 * @param {string} uuid
 * @param {Object} appointmentData
 * @returns {Promise<number>} Number of affected rows
 */
async function updateAppointment(uuid, appointmentData) {
    const [count] = await AppointmentRepository.updateByUuid(uuid, appointmentData);

    if (count === 0) {
        throw new NotFoundError('Error, cita no encontrada', { uuid });
    }

    return count;
}

/**
 * Updates appointment status and optional notes.
 *
 * @param {string} uuid
 * @param {{status: string, notes?: string}} payload
 * @returns {Promise<number>} Number of affected rows
 */
async function updateAppointmentStatus(uuid, payload) {
    const [count] = await AppointmentRepository.updateByUuid(uuid, payload);

    if (count === 0) {
        throw new NotFoundError('Error, cita no encontrada', { uuid });
    }

    return count;
}

module.exports = {
    createAppointment,
    completeAppointmentWithClinicalData,

    getAppointments,
    getAppointment,
    getAppointmentPlain,
    getFilteredAppointments,
    searchAppointments,

    updateAppointment,
    updateAppointmentStatus,
};
