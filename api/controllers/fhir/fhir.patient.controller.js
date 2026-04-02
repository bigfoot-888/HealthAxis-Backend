const patientService = require('../../../services/patient.service');
const { mapPatientToFhir } = require('../../fhir/mappers/patient.mapper');
const { buildBundle } = require('../../fhir/utils/bundle.utils');

async function getPatient(req, res) {
    const { uuid } = req.params;

    const patient = await patientService.getPatient(uuid);
    console.log(patient)
    const fhirPatient = mapPatientToFhir(patient);

    res.json(fhirPatient);
}

async function searchPatients(req, res) {
    const { identifier, name } = req.query;

    const patients = await patientService.searchPatients({
        identifier: identifier?.trim() || undefined,
        name: name?.trim() || undefined,
    });

    const resources = (patients || []).map(mapPatientToFhir);

    res.json(buildBundle(resources));
}

module.exports = {
    getPatient,
    searchPatients,
};
