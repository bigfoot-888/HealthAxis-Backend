const { mapStatus, mapFullName, mapDateToInstant } = require('../utils/mapper.utils');

function mapUserToFhirPractitioner(user) {
    return {
        resourceType: 'Practitioner',
        id: user.uuid,

        meta: {
            lastUpdated: mapDateToInstant(user.updatedAt),
        },

        active: mapStatus(user),

        name: [
            {
                use: 'official',
                given: [user.name],
                family: user.surname,
                text: mapFullName(user),
            },
        ],

        telecom: [
            {
                system: 'email',
                value: user.email,
                use: 'work',
            },
            {
                system: 'phone',
                value: user.phone,
                use: 'work',
            },
        ],

        qualification: user.roles?.length
            ? user.roles.map((role) => ({
                  code: {
                      text: role.name,
                  },
              }))
            : undefined,
    };
}

module.exports = {
    mapUserToFhirPractitioner,
}