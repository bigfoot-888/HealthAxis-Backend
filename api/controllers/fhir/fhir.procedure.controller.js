const treatmentService = require('../../../services/treatment.service');
const { mapTreatmentToFhirProcedure } = require('../../fhir/mappers/treatment.mapper');
const { buildBundle } = require('../../fhir/utils/bundle.utils');

async function getProcedure(req, res) {
    const { uuid } = req.params;
    const procedure = await treatmentService.getTreatment(uuid);
    const fhirProcedure = mapTreatmentToFhirProcedure(procedure);
    res.json(fhirProcedure);
}

async function searchProcedures(req, res) {
    const { patient, name } = req.query;
    const patients = await treatmentService.searchTreatments({
        patient,
        name,
    });
    const resources = (patients || []).map(mapTreatmentToFhirProcedure);
    res.json(buildBundle(resources));
}

module.exports = {
    getProcedure,
    searchProcedures,
};
