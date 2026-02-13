
const patientService = require('../../modules/patient-service');
const ValidationError = require('../../errors/ValidationError.js')
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

async function createPatientController(req, res) {
    try {
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
            sex
        };
        console.log(patientData)
        const newPatient = await patientService.createPatient(patientData);
        res.status(201).json(patientData);
    } catch (err) {
        console.log(err);
    }
}

async function getPatientsController(req, res) {
    try {
        const patients = await patientService.getPatients();
        res.status(201).json(patients);
    } catch (err) {
        console.log(err);
    }
}

async function deactivatePatientController(req, res) {
    try {
        const id = req.body.id;
        const patient = await patientService.deactivatePatient(id);
        res.status(201).json(patient);
    } catch (err) {
        console.log(err);
    }
}

async function importPatientsController(req, res){
    const {patients} = req.body; 
    await patientService.importPatients(patients);  
    return res.status(201).json(patients); 
}

async function getPatientController(req, res) {
    const patientUuid = req.params.id;  
    if (!uuidValidate(patientUuid)){
        throw new ValidationError("El identificador de paciente no es válido", 400, {uuid: patientUuid})
    }
    const patient = await patientService.getPatient(patientUuid);
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
        address_line2
    };
    const patient = patientService.updatePatient(uuid, patientData); 
    return res.status(201).json(patient); 
}

module.exports = {
    createPatientController,
    getPatientsController,
    deactivatePatientController,
    importPatientsController,
    getPatientController,
    updatePatientController
};
