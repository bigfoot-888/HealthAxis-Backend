const diagnosisService = require('../../modules/diagnosis-service');

// ===== CREATE =====

async function createDiagnosisController(req, res) {
    const { appointment, patient, users, ...diagnosisData } = req.body;
    const payload = {
        ...diagnosisData,
        appointmentId: appointment?.id,
        patientId: patient?.id,
    };

    const mappedUsers = users.map((p) => ({
        user: { id: p.user.id, role: p.role },
    }));

    const diagnosis = await diagnosisService.createDiagnosis(payload, mappedUsers);
    res.status(201).json(diagnosis);
}

// ===== READ =====

async function getDiagnosesController(req, res) {
    const diagnoses = await diagnosisService.getDiagnoses();
    res.status(200).json(diagnoses);
}

async function getDiagnosesPlainController(req, res) {
    const diagnoses = await diagnosisService.getDiagnosesPlain();
    res.status(200).json(diagnoses);
}

async function getDiagnosesAndUsersController(req, res) {
    const diagnoses = await diagnosisService.getDiagnosesAndUsers();
    res.status(200).json(diagnoses);
}

async function getDiagnosesAndTreatmentsController(req, res) {
    const diagnoses = await diagnosisService.getDiagnosesAndTreatments();
    res.status(200).json(diagnoses);
}

async function getDiagnosisController(req, res) {
    const { uuid } = req.params;
    const diagnosis = await diagnosisService.getDiagnosis(uuid);
    res.status(200).json(diagnosis);
}

async function getDiagnosisPlainController(req, res) {
    const { uuid } = req.params;
    const diagnosis = await diagnosisService.getDiagnosisPlain(uuid);
    res.status(200).json(diagnosis);
}

async function getDiagnosisByIdController(req, res) {
    const { id } = req.params;
    const diagnosis = await diagnosisService.getDiagnosisById(id);
    res.status(200).json(diagnosis);
}

async function getFilteredDiagnosesController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit) || 20;
    const diagnoses = await diagnosisService.getFilteredDiagnoses(query, limit);
    res.status(200).json(diagnoses);
}

// ===== UPDATE =====

async function updateDiagnosisStateController(req, res) {
    const { uuid } = req.params;
    const { state } = req.body;
    const updated = await diagnosisService.updateDiagnosisState(uuid, state);
    res.status(200).json({ updated });
}

async function updateDiagnosisRecordStateController(req, res) {
    const { uuid } = req.params;
    const { recordState } = req.body;
    const updated = await diagnosisService.updateDiagnosisRecordState(uuid, recordState);
    res.status(200).json({ updated });
}

module.exports = {
    createDiagnosisController,

    getDiagnosesController,
    getDiagnosesPlainController,
    getDiagnosesAndUsersController,
    getDiagnosesAndTreatmentsController,
    getDiagnosisController,
    getDiagnosisByIdController,
    getFilteredDiagnosesController,
    getDiagnosisPlainController,

    updateDiagnosisStateController,
    updateDiagnosisRecordStateController,
};
