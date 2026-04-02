const { mapDateToInstant, mapAppointmentStatus, mapCreatedAt } = require('../utils/mapper.utils');

function mapAppointmentToFhirAppointment(appointment) {
    const notes = [appointment.notes && { text: appointment.notes }].filter(Boolean);

    return {
        resourceType: 'Appointment',
        id: appointment.uuid,
        meta: {
            lastUpdated: mapDateToInstant(appointment.updatedAt),
        },
        status: mapAppointmentStatus(appointment),

        start: mapDateToInstant(appointment.startTime),
        end: appointment.endTime ? mapDateToInstant(appointment.endTime) : undefined,

        description: appointment.reason,
        created: mapDateToInstant(appointment.createdAt),
        subject: {
            reference: `Patient/${appointment.patient.uuid}`,
        },
        participant: [
            {
                actor: {
                    reference: `Patient/${appointment.patient.uuid}`,
                },
                required: true,
                status: 'accepted',
            },
            {
                actor: {
                    reference: `Practitioner/${appointment.user.uuid}`,
                },
                required: true,
                status: 'accepted',
            },
            appointment.location && {
                actor: {
                    display: appointment.location,
                },
                status: 'accepted',
            },
        ],

        note: notes.length ? notes : undefined,
    };
}

module.exports = {
    mapAppointmentToFhirAppointment,
};
