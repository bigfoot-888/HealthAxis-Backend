const patientService = require('../../modules/patient-service');
const ValidationError = require('../../errors/ValidationError.js');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

/**
 * Handles the HTTP request to create a new patient record.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
async function createPatientController(req, res) {
    const { name, surname, email, sex, phone, address_line1, address_line2, dni, date_of_birth, nhc } = req.body;
    const patientData = {
        name,
        surname,
        email,
        phone,
        address_line1,
        address_line2,
        dni,
        date_of_birth,
        nhc,
        sex,
    };
    const newPatient = await patientService.createPatient(patientData);
    res.status(201).json(newPatient);
}

async function getPatientsController(req, res) {
    const patients = await patientService.getPatients();
    res.status(201).json(patients);
}

async function getFilteredPatientsController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit) || 20;
    const patients = await patientService.getFilteredPatients(query, limit);
    res.status(201).json(patients);
}

async function deactivatePatientController(req, res) {
    const id = req.body.id;
    const patient = await patientService.deactivatePatient(id);
    res.status(201).json(patient);
}
async function reactivatePatientController(req, res) {
    const id = req.body.id;
    const patient = await patientService.reactivatePatient(id);
    res.status(201).json(patient);
}

async function importPatientsController(req, res) {
    const { patients } = req.body;
    await patientService.importPatients(patients);
    return res.status(201).json(patients);
}

async function getPatientController(req, res) {
    const patientUuid = req.params.id;
    if (!uuidValidate(patientUuid)) {
        throw new ValidationError('El identificador de paciente no es válido', 400, { uuid: patientUuid });
    }
    const patient = await patientService.getPatient(patientUuid);
    return res.status(201).json(patient);
}

async function getPatientDetailController(req, res) {
    const patientUuid = req.params.uuid;
    if (!uuidValidate(patientUuid)) {
        throw new ValidationError('El identificador de paciente no es válido', 400, { uuid: patientUuid });
    }
    const patient = await patientService.getPatientDetail(patientUuid);
    return res.status(201).json(patient);
}

async function updatePatientController(req, res) {
    const uuid = req.params.id;
    const { name, surname, email, phone, address_line1, address_line2 } = req.body;
    const patientData = {
        name,
        surname,
        email,
        phone,
        address_line1,
        address_line2,
    };
    const patient = patientService.updatePatient(uuid, patientData);
    return res.status(201).json(patient);
}

async function getPatientFlowController(req, res) {
    const uuid = req.params.uuid;
    const flow = await patientService.getPatientFlow(uuid);
    return res.status(201).json(flow);
}

module.exports = {
    createPatientController,
    importPatientsController,

    getPatientsController,
    getPatientController,
    getFilteredPatientsController,
    getPatientDetailController,
    getPatientFlowController,

    updatePatientController,
    deactivatePatientController,
    reactivatePatientController,
};
