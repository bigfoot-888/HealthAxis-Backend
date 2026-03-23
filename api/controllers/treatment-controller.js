const treatmentService = require('../../modules/treatment-service');

// ===== CREATE =====

async function createTreatmentController(req, res) {
    const { appointment, patient, users, diagnoses, ...treatmentData } = req.body;
    const payload = {
        ...treatmentData,
        appointmentId: appointment?.id,
        patientId: patient?.id,
    };

    const mappedUsers = users.map((p) => ({
        user: { id: p.user.id, role: p.role },
    }));

    const mappedDiagnoses = diagnoses.map((d)=>({
        diagnosis: {id: d.diagnosis.id}
    }))

    const treatment = await treatmentService.createTreatment(payload, mappedUsers, mappedDiagnoses);
    res.status(201).json(treatment);
}

// ===== READ =====

async function getTreatmentsController(req, res) {
    const treatment = await treatmentService.getTreatments();
    res.status(200).json(treatment);
}

async function getTreatmentPlainController(req, res) {
    const treatment = await treatmentService.getTreatmentPlain();
    res.status(200).json(treatment);
}

async function getTreatmentAndUsersController(req, res) {
    const treatment = await treatmentService.getTreatmentAndUsers();
    res.status(200).json(treatment);
}

async function getTreatmentAndTreatmentController(req, res) {
    const treatment = await treatmentService.getTreatmentAndTreatment();
    res.status(200).json(treatment);
}

async function getTreatmentController(req, res) {
    const { uuid } = req.params;
    const diagnosis = await treatmentService.getTreatment(uuid);
    res.status(200).json(diagnosis);
}

async function getTreatmentPlainController(req, res) {
    const { uuid } = req.params;
    const diagnosis = await treatmentService.getTreatmentPlain(uuid);
    res.status(200).json(diagnosis);
}

async function getTreatmentByIdController(req, res) {
    const { id } = req.params;
    const diagnosis = await treatmentService.getTreatmentById(id);
    res.status(200).json(diagnosis);
}

async function getFilteredTreatmentsController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit) || 20;
    const treatment = await treatmentService.getFilteredTreatment(query, limit);
    res.status(200).json(treatment);
}

// ===== UPDATE =====

async function updateTreatmentStateController(req, res) {
    const { uuid } = req.params;
    const { state } = req.body;
    const updated = await treatmentService.updateTreatmentState(uuid, state);
    res.status(200).json({ updated });
}

async function updateTreatmentRecordStateController(req, res) {
    const { uuid } = req.params;
    const { recordState } = req.body;
    const updated = await treatmentService.updateTreatmentRecordState(uuid, recordState);
    res.status(200).json({ updated });
}

module.exports = {
    createTreatmentController,

    getTreatmentsController,
    getTreatmentPlainController,
    getTreatmentAndUsersController,
    getTreatmentAndTreatmentController,
    getTreatmentController,
    getTreatmentByIdController,
    getFilteredTreatmentsController,
    getTreatmentPlainController,

    updateTreatmentStateController,
    updateTreatmentRecordStateController,
};
