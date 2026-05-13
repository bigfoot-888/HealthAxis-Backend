const patientService = require('../../services/patient.service');

// ===== CREATE =====

async function createPatientController(req, res) {
    const { name, surname, email, sex, phone, addressLine1, addressLine2, dni, dateOfBirth } = req.body;

    const patientData = {
        name,
        surname,
        email,
        sex,
        phone,
        addressLine1,
        addressLine2,
        dni,
        dateOfBirth,
    };
    const newPatient = await patientService.createPatient(patientData);
    res.status(201).json(newPatient);
}

async function importPatientsController(req, res) {
    const { patients } = req.body;
    const importedPatients = await patientService.importPatients(patients);
    res.status(201).json(importedPatients);
}

async function createSecondaryNodeController(req, res) {
    const { parentEventId, clinicalDocumentId } = req.body;
    const newNode = await patientService.createSecondaryNode(parentEventId, clinicalDocumentId, req.user.id);
    res.status(201).json(newNode);
}

// ===== READ =====

async function getPatientsController(req, res) {
    const patients = await patientService.getPatients();
    res.status(200).json(patients);
}

async function getPatientHistoryController(req, res) {
    const { uuid } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const {logs, total} = await patientService.getPatientHistory(uuid, page, limit);
    res.status(200).json({logs, total});
}

async function getFilteredPatientsController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit, 10) || 20;

    const patients = await patientService.getFilteredPatients(query, limit);
    res.status(200).json(patients);
}

async function getPatientController(req, res) {
    const { uuid } = req.params;
    const patient = await patientService.getPatient(uuid);
    res.status(200).json(patient);
}

async function getPatientDetailController(req, res) {
    const { uuid } = req.params;
    const patient = await patientService.getPatientDetail(uuid);
    res.status(200).json(patient);
}

async function getPatientFlowController(req, res) {
    const { uuid } = req.params;
    const flow = await patientService.getPatientFlow(uuid);
    res.status(200).json(flow);
}

// ===== UPDATE =====

async function updatePatientController(req, res) {
    const { uuid } = req.params;
    const { name, surname, email, phone, addressLine1, addressLine2 } = req.body;

    const patientData = {
        name,
        surname,
        email,
        phone,
        addressLine1,
        addressLine2,
    };

    const updatedCount = await patientService.updatePatient(uuid, patientData, req.user.id);
    res.status(200).json({ updated: updatedCount });
}

async function deactivatePatientController(req, res) {
    const { uuid } = req.params;
    const count = await patientService.deactivatePatient(uuid, req.user.id);
    res.status(200).json({ updated: count });
}

async function reactivatePatientController(req, res) {
    const { uuid } = req.params;
    const count = await patientService.reactivatePatient(uuid, req.user.id);
    res.status(200).json({ updated: count });
}

async function deleteFlowEventController(req, res) {
    const {id} = req.params; 
    const count = await patientService.deleteFlowEvent(id); 
    res.status(200).json({deleted: count})
}

module.exports = {
    createPatientController,
    importPatientsController,
    getPatientsController,
    getFilteredPatientsController,
    getPatientController,
    getPatientDetailController,
    getPatientFlowController,
    updatePatientController,
    deactivatePatientController,
    reactivatePatientController,
    deleteFlowEventController,
    createSecondaryNodeController,
    getPatientHistoryController,
};
