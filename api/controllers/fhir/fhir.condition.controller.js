const diagnosisService = require('../../../services/diagnosis.service');
const { mapDiagnosisToFhirCondition } = require('../../fhir/mappers/diagnosis.mapper');
const { buildBundle } = require('../../fhir/utils/bundle.utils');

async function getCondition(req, res) {
    const { uuid } = req.params;
    const diagnosis = await diagnosisService.getDiagnosis(uuid);
    const condition = mapDiagnosisToFhirCondition(diagnosis);
    res.json(condition);
}

async function searchConditions(req, res) {
    const { patient, name } = req.query;
    const diagnoses = await diagnosisService.searchDiagnoses({
        patient,
        name,
    });
    const resources = (diagnoses || []).map(mapDiagnosisToFhirCondition);

    res.json(buildBundle(resources));
}

module.exports = {
    getCondition,
    searchConditions
}