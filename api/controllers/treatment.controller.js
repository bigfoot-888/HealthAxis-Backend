const treatmentService = require('../../services/treatment.service');

// ===== CREATE =====

async function createTreatmentController(req, res) {
    const { appointment, patient, users = [], diagnoses = [], ...treatmentData } = req.body;

    const payload = {
        ...treatmentData,
        appointmentId: appointment?.id,
        patientId: patient?.id,
    };

    const mappedUsers = users.map(({ user, role, assignedAt }) => ({
        user: {
            id: user.id,
            role,
            ...(assignedAt && { assignedAt }),
        },
    }));

    const mappedDiagnoses = diagnoses.map(({ diagnosis }) => ({
        diagnosis: { id: diagnosis.id },
    }));

    const treatment = await treatmentService.createTreatment(payload, mappedUsers, mappedDiagnoses);

    res.status(201).json(treatment);
}

// ===== READ =====

async function getTreatmentsController(req, res) {
    const treatments = await treatmentService.getTreatments();
    res.status(200).json(treatments);
}

async function getTreatmentController(req, res) {
    const { uuid } = req.params;
    const treatment = await treatmentService.getTreatment(uuid);
    res.status(200).json(treatment);
}

async function getTreatmentPlainController(req, res) {
    const { uuid } = req.params;
    const treatment = await treatmentService.getTreatmentPlain(uuid);
    res.status(200).json(treatment);
}

// ===== UPDATE =====

async function updateTreatmentClinicalStatusController(req, res) {
    const { uuid } = req.params;
    const { clinicalStatus } = req.body;

    const updated = await treatmentService.updateTreatmentClinicalStatus(uuid, clinicalStatus);
    res.status(200).json({ updated });
}

async function updateTreatmentStatusController(req, res) {
    const { uuid } = req.params;
    const { status } = req.body;

    const updated = await treatmentService.updateTreatmentStatus(uuid, status);
    res.status(200).json({ updated });
}

module.exports = {
    createTreatmentController,
    getTreatmentsController,
    getTreatmentController,
    getTreatmentPlainController,
    updateTreatmentClinicalStatusController,
    updateTreatmentStatusController,
};
