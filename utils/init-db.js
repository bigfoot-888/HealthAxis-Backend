require('dotenv').config();
const sequelize = require('../config/database');
const { User } = require('../models/user-model');
const { Patient } = require('../models/patient-model');
const { Appointment } = require('../models/appointment-model');
const { Agenda, AgendaPeriod } = require('../models/agenda-model');
const { Role } = require('../models/role-model');
const { ClinicalDocument, ClinicalDocumentEntity, ClinicalAttachment, ClinicalDocumentUser } = require('../models/clinical-document-model');
const {Treatment, TreatmentUser} = require('../models/treatment-model'); 
const {Diagnosis, DiagnosisUser} = require('../models/diagnosis-model')
const {PatientFlow, FlowEdge, FlowEvent} = require('../models/patient-flow'); 
const {UserDashboard, DashboardComponent} = require('../models/dashboard-model'); 
const associate = () => {
    console.log('Models found in Sequelize instance:', Object.keys(sequelize.models));
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
