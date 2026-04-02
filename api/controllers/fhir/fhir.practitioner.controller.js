const userService = require('../../../services/user.service');
const { mapUserToFhirPractitioner } = require('../../fhir/mappers/user.mapper');
const { buildBundle } = require('../../fhir/utils/bundle.utils');

async function getPractitioner(req, res) {
    const { uuid } = req.params;
    const user = await userService.getUser(uuid);
    const practitioner = mapUserToFhirPractitioner(user);
    res.json(practitioner);
}

async function searchPractitioners(req, res) {
    const { name } = req.query;
    const users = await userService.searchUsers({ name });
    const resources = (users || []).map(mapUserToFhirPractitioner);
    res.json(buildBundle(resources));
}

module.exports = {
    getPractitioner,
    searchPractitioners,
};
