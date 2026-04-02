const { mapDateToInstant, mapDiagnosisClinicalStatus, mapDiagnosisStatus } = require('../utils/mapper.utils');

function mapDiagnosisToFhirCondition(diagnosis) {
    const notes = [
        diagnosis.description && { text: diagnosis.description },
        diagnosis.notes && { text: diagnosis.notes },
    ].filter(Boolean);
    
    return {
        resourceType: 'Condition',
        id: diagnosis.uuid,
        meta: {
            lastUpdated: mapDateToInstant(diagnosis.updatedAt),
        },

        clinicalStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: mapDiagnosisClinicalStatus(diagnosis),
                },
            ],
        },

        verificationStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                    code: mapDiagnosisStatus(diagnosis),
                },
            ],
        },

        severity: {
            text: diagnosis.severity,
        },

        code: {
            text: diagnosis.name,
        },

        subject: {
            reference: `Patient/${diagnosis.patient.uuid}`,
        },

        recordedDate: mapDateToInstant(diagnosis.createdAt),

        note: notes.length ? notes : undefined,
    };
}

module.exports = {
    mapDiagnosisToFhirCondition,
};
