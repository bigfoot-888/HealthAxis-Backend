function mapStatus(entity) {
    if (entity.status === 'ACTIVE') return true;
    else return false;
}

function mapCreatedAt(entity) {
    return entity.createdAt.toLocaleDateString("es-ES"); 
}

function mapFullName(person) {
    return person.name + " " + person.surname; 
}

function mapGender(patient) {
    if (patient.sex === "MALE") return "male";
    else if (patient.sex === "FEMALE") return "female";
    else return "unknown"; 
}

function mapFullAddress(patient) {
    return [patient.addressLine1, patient.addressLine2]
        .filter(Boolean)
        .join(', ');
}

function mapDateToInstant(date) {
    return new Date(date).toISOString();
}

function mapDiagnosisClinicalStatus(diagnosis) {
    const map = {
        ACTIVE: "active",
        CHRONIC: "active",
        RESOLVED: "resolved",
        RULED_OUT: "inactive",
    };
    return map[diagnosis.clinicalStatus] || 'unknown';
}
function mapDiagnosisStatus(diagnosis) {
    if (diagnosis.clinicalStatus === "RULED_OUT") {
        return "refuted"
    }
    else {
        const map = {
            VALID: "confirmed",
            VOID: "refuted",
            ENTERED_IN_ERROR: "entered-in-error"
        }
        return map[diagnosis.status] || 'confirmed'; 
    }
}

function mapTreatmentStatus(treatment) {
    if (treatment.status === "ENTERED_IN_ERROR")
        return "entered-in-error"
    else {
        const map = {
            PLANNED: "preparation",
            ONGOING: "in-progress",
            GIVEN: "completed",
            COMPLETED: "completed",
            DISCONTINUED: "stopped"
        }

        return map[treatment.clinicalStatus] || 'unknown'; 
    }
}
function mapAppointmentStatus(appointment){
    const map = {
        SCHEDULED: "booked",
        COMPLETED: "fulfilled",
        CANCELLED: "cancelled",
        NO_SHOW: "noshow",
        CHECKED_IN: "arrived",
    }

    return map[appointment.status] || "pending"; 
}

module.exports = {
    mapStatus,
    mapCreatedAt,
    mapFullName,
    mapGender,
    mapFullAddress,
    mapDateToInstant,

    mapDiagnosisClinicalStatus,
    mapDiagnosisStatus,

    mapTreatmentStatus,

    mapAppointmentStatus,
}