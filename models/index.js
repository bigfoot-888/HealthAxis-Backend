const { Agenda, AgendaPeriod } = require('./agenda.model');
const { Appointment } = require('./appointment.model');
const { User } = require('./user.model');
const { Patient } = require('./patient.model');
const { Role, UserRole } = require('./role.model');
const { Permission, RolePermission } = require('./permission.model')
const {
    ClinicalDocument,
    ClinicalAttachment,
    ClinicalDocumentUser,
    ClinicalDocumentAndAttachment,
} = require('./clinical-document.model');
const { Diagnosis, DiagnosisUser } = require('./diagnosis.model');
const { Treatment, TreatmentUser } = require('./treatment.model');
const { PatientFlow, FlowEvent } = require('./patient-flow.model');
const { UserDashboard, DashboardComponent } = require('./dashboard.model');
const { AuditLog } = require('./audit-log.model');



const associate = async () => {
    // ===== Agenda associations =====
    Agenda.hasMany(AgendaPeriod, {
        foreignKey: 'agendaId',
        sourceKey: 'id', 
        as: 'periods', 
    });
    Agenda.hasOne(AgendaPeriod, {
        as: 'activePeriod',
        foreignKey: 'agendaId',
        sourceKey: 'id', 
        scope: { status: 'ACTIVE' },
        constraints: false,
    });
    AgendaPeriod.belongsTo(Agenda, {
        foreignKey: 'agendaId',
        targetKey: 'id', 
        as: 'agenda', 
    });
    Agenda.hasMany(User, {
        foreignKey: 'agendaId',
        sourceKey: 'id',
        as: 'users', 
    });
    User.belongsTo(Agenda, {
        foreignKey: 'agendaId',
        targetKey: 'id',
        as: 'agenda',
    });

    // ===== Appointment associations =====
    User.hasMany(Appointment, { foreignKey: 'userId', sourceKey: 'id', as: 'appointments' }); 
    Appointment.belongsTo(User, { foreignKey: 'userId', targetKey: 'id', as: 'user' }); 

    Patient.hasMany(Appointment, { foreignKey: 'patientId', sourceKey: 'id', as: 'appointments' }); 
    Appointment.belongsTo(Patient, { foreignKey: 'patientId', targetKey: 'id', as: 'patient' }); 

    Appointment.hasMany(Diagnosis, { foreignKey: 'appointmentId', sourceKey: 'id', as: 'diagnoses' }); 
    Diagnosis.belongsTo(Appointment, { foreignKey: 'appointmentId', targetKey: 'id', as: 'appointment' }); 

    Appointment.hasMany(Treatment, { foreignKey: 'appointmentId', sourceKey: 'id', as: 'treatments' }); 
    Treatment.belongsTo(Appointment, { foreignKey: 'appointmentId', targetKey: 'id', as: 'appointment' }); 

    // ===== Role associations =====
    User.belongsToMany(Role, {
        through: UserRole,
        as: 'roles',
        foreignKey: 'userId',
        otherKey: 'roleId', 
        sourceKey: 'id', 
        targetKey: 'id', 
    });
    Role.belongsToMany(User, {
        through: UserRole,
        as: 'users',
        foreignKey: 'roleId',
        otherKey: 'userId', 
        sourceKey: 'id', 
        targetKey: 'id', 
    });

    Role.belongsToMany(Permission, {
        through: RolePermission,
        as: 'permissions',
        foreignKey: 'roleId',
        otherKey: 'permissionId', 
        sourceKey: 'id', 
        targetKey: 'id', 
    });

    Permission.belongsToMany(Role, {
        through: RolePermission,
        as: "roles",
        foreignKey: 'permissionId',
        otherKey: 'roleId', 
        sourceKey: 'id', 
        targetKey: 'id', 
    });

    // ===== Clinical document associations =====

    ClinicalDocument.belongsToMany(ClinicalAttachment, {
        through: ClinicalDocumentAndAttachment,
        as: 'clinicalAttachments',
        foreignKey: 'clinicalDocumentId',
        otherKey: 'clinicalAttachmentId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });
    ClinicalAttachment.belongsToMany(ClinicalDocument, {
        through: ClinicalDocumentAndAttachment,
        as: 'clinicalDocuments',
        foreignKey: 'clinicalAttachmentId',
        otherKey: 'clinicalDocumentId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });

    User.hasMany(ClinicalAttachment, { foreignKey: 'userId', sourceKey: 'id', as: 'clinicalAttachments' }); 
    ClinicalAttachment.belongsTo(User, { foreignKey: 'userId', targetKey: 'id', as: 'user' }); 

    ClinicalDocument.belongsToMany(User, {
        through: ClinicalDocumentUser,
        as: 'users',
        foreignKey: 'clinicalDocumentId',
        otherKey: 'userId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });
    User.belongsToMany(ClinicalDocument, {
        through: ClinicalDocumentUser,
        as: 'clinicalDocuments',
        foreignKey: 'userId',
        otherKey: 'clinicalDocumentId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });

    // ===== Diagnosis and treatment associations =====
    Diagnosis.belongsToMany(User, {
        through: DiagnosisUser,
        as: 'users',
        foreignKey: 'diagnosisId',
        otherKey: 'userId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });
    User.belongsToMany(Diagnosis, {
        through: DiagnosisUser,
        as: 'diagnoses',
        foreignKey: 'userId',
        otherKey: 'diagnosisId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });

    Treatment.belongsToMany(User, {
        through: TreatmentUser,
        as: 'users',
        foreignKey: 'treatmentId',
        otherKey: 'userId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });
    User.belongsToMany(Treatment, {
        through: TreatmentUser,
        as: 'treatments',
        foreignKey: 'userId',
        otherKey: 'treatmentId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });

    Diagnosis.hasMany(Treatment, { foreignKey: 'diagnosisId', sourceKey: 'id', as: 'treatments' }); 
    Treatment.belongsTo(Diagnosis, { foreignKey: 'diagnosisId', targetKey: 'id', as: 'diagnosis' }); 

    // ===== Patient associations =====
    Patient.hasMany(Diagnosis, { foreignKey: 'patientId', sourceKey: 'id', as: 'diagnoses' });  
    Diagnosis.belongsTo(Patient, { foreignKey: 'patientId', targetKey: 'id', as: 'patient' });  

    Patient.hasMany(Treatment, { foreignKey: 'patientId', sourceKey: 'id', as: 'treatments' }); 
    Treatment.belongsTo(Patient, { foreignKey: 'patientId', targetKey: 'id', as: 'patient' }); 

    // ===== Patient flow associations =====
    Patient.hasOne(PatientFlow, { foreignKey: 'patientId', sourceKey: 'id', as: 'flow' }); 
    PatientFlow.belongsTo(Patient, { foreignKey: 'patientId', targetKey: 'id', as: 'patient' }); 

    PatientFlow.hasMany(FlowEvent, { foreignKey: 'patientFlowId', sourceKey: 'id', as: 'events', onDelete: 'CASCADE' }); 
    FlowEvent.belongsTo(PatientFlow, { foreignKey: 'patientFlowId', targetKey: 'id', as: 'flow' }); 

    FlowEvent.belongsTo(FlowEvent, { as: 'parent', foreignKey: 'parentEventId', targetKey: 'id' }); 
    FlowEvent.hasMany(FlowEvent, { as: 'children', foreignKey: 'parentEventId', sourceKey: 'id' }); 

    // ===== Dashboard associations =====
    User.hasOne(UserDashboard, { foreignKey: 'userId', sourceKey: 'id', as: 'dashboard' }); 
    UserDashboard.belongsTo(User, { foreignKey: 'userId', targetKey: 'id', as: 'user' }); 

    UserDashboard.hasMany(DashboardComponent, {
        foreignKey: 'dashboardId',
        sourceKey: 'id',
        as: 'components',
        onDelete: 'CASCADE',
    }); 
    DashboardComponent.belongsTo(UserDashboard, { foreignKey: 'dashboardId', targetKey: 'id', as: 'dashboard' }); 

    // ===== Audit logs =====
    User.hasMany(AuditLog, { foreignKey: 'userId', sourceKey: 'id', as: 'auditLogs' }); 
    AuditLog.belongsTo(User, { foreignKey: 'userId', targetKey: 'id', as: 'user' }); 

    Patient.hasMany(AuditLog, { foreignKey: 'patientId', sourceKey: 'id', as: 'auditLogs' });
    AuditLog.belongsTo(Patient, { foreignKey: 'patientId', targetKey: 'id', as: 'patient' });
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
    Diagnosis,
    DiagnosisUser,
    Treatment,
    TreatmentUser,
    PatientFlow,
    FlowEvent,
    UserDashboard,
    DashboardComponent,
    AuditLog,
    ClinicalDocumentUser,
    Permission,
    RolePermission,
    associate,
};
