const { mapDateToInstant, mapTreatmentStatus } = require('../utils/mapper.utils');

function mapTreatmentToFhirProcedure(treatment) {
    const notes = [
        treatment.description && { text: treatment.description },
        treatment.notes && { text: treatment.notes },
    ].filter(Boolean);

    return {
        resourceType: 'Procedure',
        id: treatment.uuid,

        meta: {
            lastUpdated: mapDateToInstant(treatment.updatedAt),
        },

        status: mapTreatmentStatus(treatment),

        code: {
            text: treatment.name,
        },

        subject: {
            reference: `Patient/${treatment.patient.uuid}`,
        },

        note: notes.length ? notes : undefined,
    };
}

module.exports = {
    mapTreatmentToFhirProcedure,
};
