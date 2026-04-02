require('dotenv').config();
const sequelize = require('../config/database');
const { User } = require('../models/user.model');
const { Patient } = require('../models/patient.model');
const { Appointment } = require('../models/appointment.model');
const { Agenda, AgendaPeriod } = require('../models/agenda.model');
const { Role, UserRole } = require('../models/role.model');
const { ClinicalDocument, ClinicalDocumentEntity, ClinicalAttachment, ClinicalDocumentUser, ClinicalDocumentAndAttachment, ClinicalDocumentAndEntity } = require('../models/clinical-document.model');
const {Treatment, TreatmentUser} = require('../models/treatment.model'); 
const {Diagnosis, DiagnosisUser, DiagnosisTreatment} = require('../models/diagnosis.model')
const {PatientFlow, FlowEdge, FlowEvent} = require('../models/patient-flow.model'); 
const {UserDashboard, DashboardComponent} = require('../models/dashboard.model'); 
const {AuditLog} = require('../models/audit-log.model')

const associate = () => {
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
    Agenda.hasMany(Appointment, {
        foreignKey: 'agendaId',
        sourceKey: 'id',
        as: 'appointments', 
    });
    Appointment.belongsTo(Agenda, {
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

    // ===== Clinical document associations =====
    ClinicalDocument.belongsToMany(ClinicalDocumentEntity, {
        through: ClinicalDocumentAndEntity,
        as: 'clinicalDocumentEntities',
        foreignKey: 'clinicalDocumentId',
        otherKey: 'clinicalDocumentEntityId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });
    ClinicalDocumentEntity.belongsToMany(ClinicalDocument, {
        through: ClinicalDocumentAndEntity,
        as: 'clinicalDocuments',
        foreignKey: 'clinicalDocumentEntityId',
        otherKey: 'clinicalDocumentId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });

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

    ClinicalDocumentEntity.belongsTo(Diagnosis, {
        foreignKey: 'entityId',
        targetKey: 'id',
        constraints: false,
        as: 'diagnosis',
    }); 
    ClinicalDocumentEntity.belongsTo(Treatment, {
        foreignKey: 'entityId',
        targetKey: 'id',
        constraints: false,
        as: 'treatment',
    }); 

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

    Treatment.belongsToMany(Diagnosis, {
        through: DiagnosisTreatment,
        as: 'diagnoses',
        foreignKey: 'treatmentId',
        otherKey: 'diagnosisId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });
    Diagnosis.belongsToMany(Treatment, {
        through: DiagnosisTreatment,
        as: 'treatments',
        foreignKey: 'diagnosisId',
        otherKey: 'treatmentId',
        sourceKey: 'id', 
        targetKey: 'id', 
    });

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

    FlowEdge.belongsTo(FlowEvent, { as: 'source', foreignKey: 'sourceEventId', targetKey: 'id', onDelete: 'CASCADE' }); 
    FlowEdge.belongsTo(FlowEvent, { as: 'target', foreignKey: 'targetEventId', targetKey: 'id', onDelete: 'CASCADE' }); 

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

const syncDatabase = async () => {
    try {
        console.log('Starting association process...');
        associate(); // This MUST run before sync
        
        console.log('Executing sync...');
        // Force: true drops everything and recreates based on CURRENT model state
        await sequelize.sync({ force: true }); 
        
        console.log('Tables created successfully!');
    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await sequelize.close();
    }
};

syncDatabase();
