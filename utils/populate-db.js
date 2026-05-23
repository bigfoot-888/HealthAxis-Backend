const { sequelize } = require('../config/database');
const {
    Agenda,
    AgendaPeriod,
    User,
    Patient,
    Appointment,
    Diagnosis,
    DiagnosisUser,
    Treatment,
    TreatmentUser,
    Role,
    UserDashboard,
    DashboardComponent,
    PatientFlow,
} = require('../models/index');

const { hashPassword } = require('./password.utils');
const { faker } = require('@faker-js/faker');
const { DEFAULT_DASHBOARD_COMPONENTS } = require('../config/dashboard');

faker.seed(42);
faker.locale = 'es';

const rand = arr => arr[Math.floor(faker.number.float() * arr.length)];

const daysAgo = n => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};

const daysAhead = n => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};

async function seed() {
    const password = await hashPassword('password123');

    // Seed agendas
    const agendas = [];
    for (let i = 0; i < 6; i++) {
        agendas.push(
            await Agenda.create({
                name: `Agenda ${i + 1}`,
                status: 'ACTIVE',
            })
        );
    }
    for (const agenda of agendas) {
        await AgendaPeriod.bulkCreate([
            {
                agendaId: agenda.id,
                openingDate: daysAgo(90),
                closingDate: daysAgo(30),
                agendaStatus: 'CLOSED',
                status: 'INACTIVE',
            },
            {
                agendaId: agenda.id,
                openingDate: daysAgo(5),
                closingDate: daysAhead(15),
                agendaStatus: 'OPEN',
                status: 'ACTIVE',
            },
            {
                agendaId: agenda.id,
                openingDate: daysAhead(30),
                closingDate: daysAhead(60),
                agendaStatus: 'CANCELLED',
                status: 'INACTIVE',
            },
        ]);
    }

    const defaultComponents = DEFAULT_DASHBOARD_COMPONENTS;

    const roles = await Role.findAll();

    const ADMIN_ROLE = roles.find(r => r.name === 'ADMINISTRATIVE');
    const CARDIO_ROLE = roles.find(r => r.name === 'CARDIOLOGIST');

    // Seed user
    const adminUser = await User.create({
        name: 'David',
        surname: 'Xu',
        email: 'david@gmail.com',
        password,
        phone: '600000000',
        agendaId: agendas[0].id,
        status: 'ACTIVE',
    });

    await adminUser.addRole(ADMIN_ROLE);

    const dashboard = await UserDashboard.create({
        userId: adminUser.id,
    });

    await DashboardComponent.bulkCreate(
        defaultComponents.map(component => ({
            ...component,
            dashboardId: dashboard.id,
        }))
    );
}

module.exports = {
    seed,
};
