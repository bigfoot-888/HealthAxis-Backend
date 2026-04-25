const diagnosisService = require('../../services/diagnosis.service');

// ===== CREATE =====

async function createDiagnosisController(req, res) {
    const { appointment, patient, users = [], ...diagnosisData } = req.body;

    const payload = {
        ...diagnosisData,
        appointmentId: appointment?.id,
        patientId: patient?.id,
    };

    const mappedUsers = users.map((p) => {
        if (!p.user.id) {
            throw new ValidationError('Usuario inválido en participantes');
        }
        return { userId: p.user.id, role: p.role };
    });

    const diagnosis = await diagnosisService.createDiagnosis(payload, mappedUsers, req.user.id);
    res.status(201).json(diagnosis);
}

// ===== READ =====

async function getDiagnosesController(req, res) {
    const diagnoses = await diagnosisService.getDiagnoses(req.query);
    res.status(200).json(diagnoses);
}

async function getFilteredDiagnosesController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit, 10) || 20;

    const diagnoses = await diagnosisService.getFilteredDiagnoses(query, limit);
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

// ===== UPDATE =====

async function updateDiagnosisClinicalStatusController(req, res) {
    const { uuid } = req.params;
    const { clinicalStatus } = req.body;

    const updated = await diagnosisService.updateDiagnosisClinicalStatus(uuid, clinicalStatus, req.user.id);
    res.status(200).json({ updated });
}

async function updateDiagnosisRecordStatusController(req, res) {
    const { uuid } = req.params;
    const { status } = req.body;

    const updated = await diagnosisService.updateDiagnosisRecordStatus(uuid, status, req.user.id);
    res.status(200).json({ updated });
}

module.exports = {
    createDiagnosisController,

    getDiagnosesController,
    getFilteredDiagnosesController,
    getDiagnosisController,
    getDiagnosisPlainController,

    updateDiagnosisClinicalStatusController,
    updateDiagnosisRecordStatusController,
};
