const {
    mapStatus,
    mapFullName,
    mapGender,
    mapFullAddress,
    mapDateToInstant,
} = require('../utils/mapper.utils');

function mapPatientToFhir(patient) {
    return {
        resourceType: 'Patient',
        id: patient.uuid,
        meta: {
            lastUpdated: mapDateToInstant(patient.updatedAt),
        },
        identifier: [
            {
                system: 'http://hospital.local/patients/nhc',
                value: patient.nhc,
                use: 'usual',
            },
            {
                system: 'http://hospital.local/patients/dni',
                value: patient.dni,
                use: 'official',
            },
        ],
        active: mapStatus(patient),
        name: [
            {
                use: 'official',
                given: [patient.name],
                family: patient.surname,
                text: mapFullName(patient),
            },
        ],
        telecom: [
            {
                system: 'phone',
                value: patient.phone,
                rank: 1,
            },
            {
                system: 'email',
                value: patient.email,
                rank: 2,
            },
        ],
        gender: mapGender(patient),

        birthDate: patient.birthDate,

        address: [
            {
                text: mapFullAddress(patient),
                line: [patient.addressLine1],
            },
        ],
    };
}

module.exports = {
    mapPatientToFhir,
};
