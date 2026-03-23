const appointmentService = require('../../modules/appointment-service');

// ===== CREATE =====

async function createAppointmentController(req, res) {
    const { reason, notes, start_time, location, type, agenda, user, patient } = req.body;
    const appointmentData = { reason, notes, start_time, location, type, agendaId: agenda.id, userId: user.id, patientId: patient.id };
    const newAppointment = await appointmentService.createAppointment(appointmentData);
    res.status(201).json(newAppointment);
}

async function getAppointmentsController(req, res) {
    const appointments = await appointmentService.getAppointments();
    res.status(201).json(appointments);
}

async function getAppointmentController(req, res) {
    const uuid = req.params.uuid;
    const appointment = await appointmentService.getAppointment(uuid);
    res.status(201).json(appointment);
}

async function getAppointmentPlainController(req, res) {
    const uuid = req.params.uuid;
    const appointment = await appointmentService.getAppointmentPlain(uuid);
    res.status(201).json(appointment);
}

async function updateAppointmentController(req, res) {
    const uuid = req.params.uuid;
    const { reason, notes, start_time, end_time, location, type, agenda } = req.body;
    const appointmentData = { reason, notes, start_time, end_time, location, type, agendaId: agenda };
    const appointment = await appointmentService.updateAppointment(uuid, appointmentData);
    return res.status(201).json(appointment);
}

async function getFilteredAppointmentsController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit) || 20;
    const appointments = await appointmentService.getFilteredAppointments(query, limit);
    res.status(201).json(appointments);
}

async function updateAppointmentStateController(req, res) {
    const uuid = req.params.uuid;
    const { state, notes } = req.body;
    const statePayload = {state}; 
    if (notes !== undefined) statePayload.notes = notes; 
    const appointment = await appointmentService.updateAppointmentState(uuid, statePayload);
    return res.status(201).json(appointment);
}

module.exports = {
    createAppointmentController,
    getAppointmentsController,
    getAppointmentController,
    getFilteredAppointmentsController,
    updateAppointmentController,
    getAppointmentPlainController,
    updateAppointmentStateController,
};
