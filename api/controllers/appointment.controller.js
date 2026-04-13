const appointmentService = require('../../services/appointment.service');

// ===== CREATE =====

async function createAppointmentController(req, res) {
    const { reason, notes, startTime, location, type, user, patient } = req.body;

    const appointmentData = {
        reason,
        notes,
        startTime,
        location,
        type,
        userId: user?.id,
        patientId: patient?.id,
    };

    const newAppointment = await appointmentService.createAppointment(appointmentData);
    res.status(201).json(newAppointment);
}

async function completeAppointmentWithClinicalData(req, res) {
    const { uuid } = req.params;
    const { diagnosis, treatments } = await appointmentService.completeAppointmentWithClinicalData(uuid, req.body);
    res.status(200).json({ diagnosis, treatments });
}

// ===== READ =====

async function getAppointmentsController(req, res) {
    const appointments = await appointmentService.getAppointments(req.query);
    res.status(200).json(appointments);
}

async function getFilteredAppointmentsController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit, 10) || 20;

    const appointments = await appointmentService.getFilteredAppointments(query, limit);
    res.status(200).json(appointments);
}

async function getAppointmentController(req, res) {
    const { uuid } = req.params;

    const appointment = await appointmentService.getAppointment(uuid);
    res.status(200).json(appointment);
}

async function getAppointmentPlainController(req, res) {
    const { uuid } = req.params;

    const appointment = await appointmentService.getAppointmentPlain(uuid);
    res.status(200).json(appointment);
}

// ===== UPDATE =====

async function updateAppointmentController(req, res) {
    const { uuid } = req.params;
    const { reason, notes, startTime, end_time, location, type, agenda } = req.body;

    const appointmentData = {
        reason,
        notes,
        startTime,
        end_time,
        location,
        type,
        agendaId: agenda,
    };

    const updatedAppointment = await appointmentService.updateAppointment(uuid, appointmentData);
    res.status(200).json(updatedAppointment);
}

// ===== STATE =====

async function updateAppointmentStatusController(req, res) {
    const { uuid } = req.params;
    const { status, notes } = req.body;

    const payload = { status };
    if (notes !== undefined) payload.notes = notes;

    const updated = await appointmentService.updateAppointmentStatus(uuid, payload);
    res.status(200).json({ updated });
}

module.exports = {
    createAppointmentController,
    completeAppointmentWithClinicalData,

    getAppointmentsController,
    getFilteredAppointmentsController,
    getAppointmentController,
    getAppointmentPlainController,

    updateAppointmentController,
    updateAppointmentStatusController,
};
