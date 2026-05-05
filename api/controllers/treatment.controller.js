const treatmentService = require('../../services/treatment.service');

// ===== CREATE =====

async function createTreatmentController(req, res) {
    const { appointment, patient, users = [], diagnosis, ...treatmentData } = req.body;

    const payload = {
        ...treatmentData,
        appointmentId: appointment?.id,
        patientId: patient?.id,
        diagnosisId: diagnosis?.id
    };

    const mappedUsers = users.map((p) => {
        if (!p.user.id) {
            throw new ValidationError('Usuario inválido en participantes');
        }
        return { userId: p.user.id, role: p.role };
    });

    const treatment = await treatmentService.createTreatment(payload, mappedUsers, req.user.id);

    res.status(201).json(treatment);
}

// ===== READ =====

async function getTreatmentsController(req, res) {
    const treatments = await treatmentService.getTreatments(req.query);
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

    const updated = await treatmentService.updateTreatmentClinicalStatus(uuid, clinicalStatus, req.user.id);
    res.status(200).json({ updated });
}

async function updateTreatmentStatusController(req, res) {
    const { uuid } = req.params;
    const { status } = req.body;

    const updated = await treatmentService.updateTreatmentStatus(uuid, status, req.user.id);
    res.status(200).json({ updated });
}


async function updateTreatmentController(req, res) {
    const { uuid } = req.params;
    const { appointment, users = [], ...treatmentData } = req.body;

    const payload = {
        ...treatmentData,
        appointmentId: appointment?.id,
    };

    const mappedUsers = users.map((p) => {
        if (!p.user.id) {
            throw new ValidationError('Usuario inválido en participantes');
        }
        return { userId: p.user.id, role: p.role };
    });

    const updatedTreatment = await treatmentService.updateTreatment(uuid, payload, mappedUsers, req.user.id);
    res.status(200).json(updatedTreatment);
}

module.exports = {
    createTreatmentController,
    getTreatmentsController,
    getTreatmentController,
    getTreatmentPlainController,
    updateTreatmentClinicalStatusController,
    updateTreatmentStatusController,
    updateTreatmentController
};
