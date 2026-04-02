const appointmentService = require('../../../services/appointment.service');
const { mapAppointmentToFhirAppointment } = require('../../fhir/mappers/appointment.mapper');
const { buildBundle } = require('../../fhir/utils/bundle.utils');

async function getAppointment(req, res) {
    const { uuid } = req.params;
    const appointment = await appointmentService.getAppointment(uuid);
    const resource = mapAppointmentToFhirAppointment(appointment);
    res.json(resource);
}
async function searchAppointments(req, res) {
    const { patient, practitioner } = req.query;
    const appointments = await appointmentService.searchAppointments({
        patient, practitioner
    });
    const resources = (appointments || []).map(mapAppointmentToFhirAppointment);
    res.json(buildBundle(resources));
}

module.exports = {
    getAppointment,
    searchAppointments,
}