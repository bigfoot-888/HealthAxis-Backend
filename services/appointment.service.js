const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const AppointmentRepository = require('../repositories/appointment.repository');

const { throwIfNotExists } = require('../utils/error-utils');
const NotFoundError = require('../errors/NotFoundError');

const { createPrimaryFlowEvent } = require('../utils/flow-event');

// ===== CREATE =====

/**
 * Creates an appointment and generates its corresponding flow event.
 *
 * Workflow:
 * - Creates appointment with UUID
 * - Creates flow event linked to the patient
 *
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<Object>} Created appointment
 */
async function createAppointment(appointmentData) {
    return await sequelize.transaction(async (t) => {
        const appointment = await AppointmentRepository.create(
            {
                ...appointmentData,
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

// ===== READ =====

/**
 * Retrieves all appointments with associations.
 *
 * @returns {Promise<Array<Object>>}
 */
async function getAppointments() {
    return await AppointmentRepository.findAll();
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

    getAppointments,
    getAppointment,
    getAppointmentPlain,
    getFilteredAppointments,
    searchAppointments,

    updateAppointment,
    updateAppointmentStatus,
};
