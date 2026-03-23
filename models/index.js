const { Agenda, AgendaPeriod } = require('./agenda-model');
const { Appointment } = require('./appointment-model');
const { User } = require('./user-model');
const { Patient } = require('./patient-model');
const { Role } = require('./role-model');
const {
    ClinicalDocument,
    ClinicalAttachment,
    ClinicalDocumentEntity,
    ClinicalDocumentUser,
} = require('./clinical-document-model');
const { Diagnosis, DiagnosisUser } = require('./diagnosis-model');
const { Treatment, TreatmentUser } = require('./treatment-model');

const { PatientFlow, FlowEvent, FlowEdge } = require('./patient-flow');

const {UserDashboard, DashboardComponent} = require('./dashboard-model'); 

const associate = () => {
    // Agenda associations
    Agenda.hasMany(AgendaPeriod, { foreignKey: 'agendaId' });
    Agenda.hasOne(AgendaPeriod, {
        as: 'activePeriod',
        foreignKey: 'agendaId',
        scope: { state: 'ACTIVE' },
        constraints: false,
    });
    AgendaPeriod.belongsTo(Agenda, { foreignKey: 'agendaId' });
    Agenda.hasMany(Appointment, { foreignKey: 'agendaId' });
    Appointment.belongsTo(Agenda, { foreignKey: 'agendaId', as: 'agenda' });

    // Appointment associations
    User.hasMany(Appointment, { foreignKey: 'userId', as: 'appointments' });
    Appointment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
    Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

    Appointment.hasMany(Diagnosis, { foreignKey: 'appointmentId', as: 'diagnoses' });
    Diagnosis.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

    Appointment.hasMany(Treatment, { foreignKey: 'appointmentId', as: 'treatments' });
    Treatment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

    // Role associations
    User.belongsToMany(Role, { through: 'UserRoles', as: 'roles', foreignKey: 'userId' });
    Role.belongsToMany(User, { through: 'UserRoles', as: 'users', foreignKey: 'roleId' });

    // Clinical document associations
    ClinicalDocument.belongsToMany(ClinicalDocumentEntity, {
        through: 'ClinicalDocumentsAndEntities',
        as: 'clinicalDocumentEntities',
        foreignKey: 'clinicalDocumentId',
        otherKey: 'clinicalDocumentEntityId',
    });
    ClinicalDocumentEntity.belongsToMany(ClinicalDocument, {
        through: 'ClinicalDocumentsAndEntities',
        as: 'clinicalDocuments',
        foreignKey: 'clinicalDocumentEntityId',
        otherKey: 'clinicalDocumentId',
    });
    ClinicalDocument.belongsToMany(ClinicalAttachment, {
        through: 'ClinicalDocumentsAndAttachments',
        as: 'clinicalAttachments',
        foreignKey: 'clinicalDocumentId',
        otherKey: 'clinicalAttachmentId',
    });
    ClinicalAttachment.belongsToMany(ClinicalDocument, {
        through: 'ClinicalDocumentsAndAttachments',
        as: 'clinicalDocuments',
        foreignKey: 'clinicalAttachmentId',
        otherKey: 'clinicalDocumentId',
    });

    User.hasMany(ClinicalAttachment, { foreignKey: 'userId', as: 'clinicalAttachments' });
    ClinicalAttachment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    ClinicalDocumentEntity.belongsTo(Diagnosis, { foreignKey: 'entityId', constraints: false, as: 'diagnosis' });
    ClinicalDocumentEntity.belongsTo(Treatment, { foreignKey: 'entityId', constraints: false, as: 'treatment' });

    ClinicalDocument.belongsToMany(User, {
        through: ClinicalDocumentUser,
        as: 'users',
        foreignKey: 'clinicalDocumentId',
        otherKey: 'userId',
    });

    User.belongsToMany(ClinicalDocument, {
        through: ClinicalDocumentUser,
        as: 'clinicalDocuments',
        foreignKey: 'userId',
        otherKey: 'clinicalDocumentId',
    });

    // Diagnosis and treatment associations
    Diagnosis.belongsToMany(User, {
        through: DiagnosisUser,
        as: 'users',
        foreignKey: 'diagnosisId',
        otherKey: 'userId',
    });

    User.belongsToMany(Diagnosis, {
        through: DiagnosisUser,
        as: 'diagnoses',
        foreignKey: 'userId',
        otherKey: 'diagnosisId',
    });

    Treatment.belongsToMany(User, {
        through: TreatmentUser,
        as: 'users',
        foreignKey: 'treatmentId',
        otherKey: 'userId',
    });

    User.belongsToMany(Treatment, {
        through: TreatmentUser,
        as: 'treatments',
        foreignKey: 'userId',
        otherKey: 'treatmentId',
    });

    Treatment.belongsToMany(Diagnosis, {
        through: 'DiagnosisTreatment',
        as: 'diagnoses',
        foreignKey: 'treatmentId',
        otherKey: 'diagnosisId',
    });
    Diagnosis.belongsToMany(Treatment, {
        through: 'DiagnosisTreatment',
        as: 'treatments',
        foreignKey: 'diagnosisId',
        otherKey: 'treatmentId',
    });

    // Patient associations
    Patient.hasMany(Diagnosis, {
        foreignKey: 'patientId',
        as: 'diagnoses',
    });

    Diagnosis.belongsTo(Patient, {
        foreignKey: 'patientId',
        as: 'patient',
    });

    Patient.hasMany(Treatment, {
        foreignKey: 'patientId',
        as: 'treatments',
    });

    Treatment.belongsTo(Patient, {
        foreignKey: 'patientId',
        as: 'patient',
    });

    // Patient flow associations

    Patient.hasOne(PatientFlow, {
        foreignKey: 'patientId',
        as: 'flow'
    })

    PatientFlow.belongsTo(Patient, {
        foreignKey: 'patientId',
        as: 'patient'
    })

    PatientFlow.hasMany(FlowEvent, {
        foreignKey: 'patientFlowId',
        as: 'events',
        onDelete: 'CASCADE',
    });

    FlowEvent.belongsTo(PatientFlow, {
        foreignKey: 'patientFlowId',
        as: 'flow',
    });

    FlowEvent.belongsTo(FlowEvent, {
        as: 'parent',
        foreignKey: 'parentEventId',
    });

    FlowEvent.hasMany(FlowEvent, {
        as: 'children',
        foreignKey: 'parentEventId',
    });

    // FlowEdge -> FlowEvent (source)
    FlowEdge.belongsTo(FlowEvent, {
        as: 'source',
        foreignKey: 'sourceEventId',
        onDelete: 'CASCADE',
    });

    // FlowEdge → FlowEvent (target)
    FlowEdge.belongsTo(FlowEvent, {
        as: 'target',
        foreignKey: 'targetEventId',
        onDelete: 'CASCADE',
    });

    // // Optional but VERY useful
    // FlowEvent.hasMany(FlowEdge, {
    //     as: 'outgoingEdges',
    //     foreignKey: 'sourceEventId',
    // });

    // Dashboard associations
    User.hasOne(UserDashboard, {
        foreignKey: 'userId',
        as: 'dashboard',
    });

    UserDashboard.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user',
    });

    UserDashboard.hasMany(DashboardComponent, {
        foreignKey: 'dashboardId',
        as: 'components',
        onDelete: 'CASCADE',
    });

    DashboardComponent.belongsTo(UserDashboard, {
        foreignKey: 'dashboardId',
        as: 'dashboard',
    });
};
associate();

module.exports = {
    Agenda,
    AgendaPeriod,
    Appointment,

    User,
    Patient,
    Role,

    ClinicalDocument,
    ClinicalAttachment,
    ClinicalDocumentEntity,

    Diagnosis,
    DiagnosisUser,
    Treatment,
    TreatmentUser,

    PatientFlow,
    FlowEvent,
    FlowEdge,

    UserDashboard,
    DashboardComponent,
};
