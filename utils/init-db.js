require('dotenv').config();
const sequelize = require('../config/database');
const { User } = require('../models/user.model');
const { Patient } = require('../models/patient.model');
const { Appointment } = require('../models/appointment.model');
const { Agenda, AgendaPeriod } = require('../models/agenda.model');
const { Role, UserRole } = require('../models/role.model');
const {
    ClinicalDocument,
    ClinicalAttachment,
    ClinicalDocumentUser,
    ClinicalDocumentAndAttachment,
} = require('../models/clinical-document.model');
const { Treatment, TreatmentUser } = require('../models/treatment.model');
const { Diagnosis, DiagnosisUser } = require('../models/diagnosis.model');
const { PatientFlow, FlowEvent } = require('../models/patient-flow.model');
const { UserDashboard, DashboardComponent } = require('../models/dashboard.model');
const { AuditLog } = require('../models/audit-log.model');
const { Permission, RolePermission } = require('../models/permission.model');

const { seedRolesAndPermissions } = require('../utils/database.utils');

const {associate} = require('../models/index')

const {seed} = require('./populate-db')


const syncDatabase = async () => {
    try {
        console.log('Starting association process...');

        console.log('Executing sync...');
        // Force: true drops everything and recreates based on CURRENT model state
        await sequelize.sync({ force: true });

        console.log('Tables created successfully!');

        await seedRolesAndPermissions();

        console.log('RBAC seeded successfully!');

        await seed();
    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await sequelize.close();
    }
};

syncDatabase();
