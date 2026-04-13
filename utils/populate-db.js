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
    DiagnosisTreatment,
    Role,
    UserDashboard,
    DashboardComponent,
    PatientFlow,
} = require('../models/index');

const { hashPassword } = require('./password.utils');
const { faker } = require('@faker-js/faker');

// ===== CONFIG =====
faker.seed(42);
faker.locale = 'es';

// ===== HELPERS =====
const rand = (arr) => arr[Math.floor(faker.number.float() * arr.length)];

const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};

const daysAhead = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};

// ===== MAIN =====
async function seed() {
    const password = await hashPassword('password123');

    // ===== AGENDAS =====
    const agendas = [];
    for (let i = 0; i < 6; i++) {
        agendas.push(
            await Agenda.create({
                name: `Agenda ${i + 1}`,
                status: 'ACTIVE',
            }),
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

    const defaultComponents = [
        {
            title: 'Total Pacientes',
            type: 'KPI',
            position: { x: 0, y: 0, w: 2, h: 2 },
            config: {
                visuals: { color: 'primary.main' },
                query: { entity: 'Patient', aggregation: 'COUNT', targetColumn: 'id' },
            },
        },
        {
            title: 'Pacientes Activos',
            type: 'KPI',
            position: { x: 2, y: 0, w: 2, h: 2 },
            config: {
                visuals: { color: 'success.main' },
                query: {
                    entity: 'Patient',
                    aggregation: 'COUNT',
                    targetColumn: 'id',
                    filters: { status: 'ACTIVE' },
                },
            },
        },
        {
            title: 'Pacientes a lo largo del tiempo',
            type: 'LINE_CHART',
            position: { x: 0, y: 2, w: 4, h: 3 },
            config: {
                visuals: { xAxisKey: 'x', yAxisKey: 'y', yAxisLabel: 'Pacientes', tooltipLabel: 'Pacientes' },
                query: {
                    entity: 'Patient',
                    aggregation: 'COUNT',
                    targetColumn: 'id',
                    groupBy: 'createdAt',
                    timeGrain: 'week',
                },
            },
        },
        {
            title: 'Citas a lo largo del tiempo',
            type: 'LINE_CHART',
            position: { x: 0, y: 5, w: 4, h: 3 },
            config: {
                visuals: { xAxisKey: 'x', yAxisKey: 'y', yAxisLabel: 'Citas', tooltipLabel: 'Citas' },
                query: {
                    entity: 'Appointment',
                    aggregation: 'COUNT',
                    targetColumn: 'id',
                    groupBy: 'startTime',
                    timeGrain: 'week',
                },
            },
        },
        {
            title: 'Distribución por Severidad',
            type: 'BAR_CHART',
            position: { x: 4, y: 0, w: 2, h: 4 },
            config: {
                visuals: { xAxisKey: 'x', yAxisKey: 'y', tooltipLabel: 'Diagnósticos' },
                query: {
                    entity: 'Diagnosis',
                    aggregation: 'COUNT',
                    targetColumn: 'id',
                    groupBy: 'severity',
                    filters: { status: 'VALID' },
                },
            },
        },
        {
            title: 'Estado de Tratamientos',
            type: 'PIE_CHART',
            position: { x: 4, y: 4, w: 2, h: 4 },
            config: {
                visuals: { nameKey: 'x', valueKey: 'y', tooltipLabel: 'Tratamientos' },
                query: {
                    entity: 'Treatment',
                    aggregation: 'COUNT',
                    targetColumn: 'id',
                    groupBy: 'status',
                    filters: { status: 'VALID' },
                },
            },
        },
    ];

    const roles = await Role.findAll();

    const ADMIN_ROLE = roles.find((r) => r.name === 'ADMINISTRATIVE');
    const CARDIO_ROLE = roles.find((r) => r.name === 'CARDIOLOGIST');

    const adminUser = await User.create({
        name: 'David',
        surname: 'Xu',
        email: 'david@gmail.com',
        password, // already hashed
        phone: '600000000',
        agendaId: agendas[0].id,
        status: 'ACTIVE',
    });

    await adminUser.addRole(ADMIN_ROLE);

    const dashboard = await UserDashboard.create({
        userId: adminUser.id,
    });

    await DashboardComponent.bulkCreate(
        defaultComponents.map((component) => ({
            ...component,
            dashboardId: dashboard.id,
        })),
    );

    // ===== USERS =====
    const users = [];
    for (let i = 0; i < 25; i++) {
        const user = await User.create({
            name: faker.person.firstName(),
            surname: faker.person.lastName(),
            email: faker.internet.email() + i,
            password,
            phone: '6' + faker.string.numeric(8),
            agendaId: agendas[i % agendas.length].id,
            status: i % 6 === 0 ? 'INACTIVE' : 'ACTIVE',
        });

        users.push(user);

        // 20% admins, 80% cardiologists
        const isAdmin = faker.number.int({ min: 1, max: 5 }) === 1;
        user.addRole(isAdmin ? ADMIN_ROLE : CARDIO_ROLE);

        const dashboard = await UserDashboard.create({
            userId: user.id,
        });

        await DashboardComponent.bulkCreate(
            defaultComponents.map((component) => ({
                ...component,
                dashboardId: dashboard.id,
            })),
        );
    }

    function generateDni(num) {
        const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
        return `${String(num).padStart(8, '0')}${letters[num % 23]}`;
    }

    // ===== PATIENTS =====
    const patients = [];
    for (let i = 0; i < 100; i++) {
        const createdAt = daysAgo(rand([5, 20, 60, 120]));

        const patient = await Patient.create({
            name: faker.person.firstName(),
            surname: faker.person.lastName(),
            email: faker.internet.email() + i,
            phone: '7' + faker.string.numeric(8),
            addressLine1: faker.location.streetAddress(),
            addressLine2: faker.datatype.boolean() ? faker.location.secondaryAddress() : null,
            sex: rand(['MALE', 'FEMALE']),
            dateOfBirth: faker.date.birthdate({ min: 18, max: 90, mode: 'age' }),
            nhc: `${String(i).padStart(6, '0')}`,
            dni: generateDni(47583940 + i),
            status: i % 10 === 0 ? 'INACTIVE' : 'ACTIVE',
            createdAt,
            updatedAt: createdAt,
        });
        patients.push(patient);
    }

    // ===== APPOINTMENTS =====
    const appointments = [];

    for (let i = 0; i < 200; i++) {
        const patient = patients[i % patients.length];
        const user = users[i % users.length];

        let status,
            startTime,
            endTime = null;

        if (i < 80) {
            status = rand(['COMPLETED', 'NO_SHOW']);
            startTime = daysAgo(rand([10, 30, 60]));
            endTime = new Date(startTime.getTime() + 30 * 60000);
        } else if (i < 120) {
            status = 'CHECKED_IN';
            startTime = daysAgo(1);
        } else if (i < 170) {
            status = 'SCHEDULED';
            startTime = daysAhead(rand([1, 5, 10]));
        } else {
            status = 'CANCELLED';
            startTime = daysAhead(rand([2, 6]));
        }

        appointments.push(
            await Appointment.create({
                userId: user.id,
                patientId: patient.id,
                reason: rand([
                    'Consulta general',
                    'Revisión',
                    'Chequeo rutinario',
                    'Resultados de laboratorio',
                    'Consulta especializada',
                ]),
                location: faker.location.city(),
                startTime,
                endTime,
                status,
                type: rand(['IN_PERSON', 'VIRTUAL']),
            }),
        );
    }

    // ===== DIAGNOSES =====
    const diagnoses = [];

    for (let i = 0; i < 120; i++) {
        const patient = patients[i % patients.length];
        const appointment = appointments[i % appointments.length];

        const clinicalStatus = rand(['ACTIVE', 'RESOLVED', 'CHRONIC', 'RULED_OUT']);
        const diagnosedAt = daysAgo(rand([5, 20, 60]));

        const resolvedAt = clinicalStatus === 'RESOLVED' ? new Date(diagnosedAt.getTime() + 5 * 86400000) : null;

        const diagnosis = await Diagnosis.create({
            patientId: patient.id,
            appointmentId: appointment.id,
            name: rand(['Hipertensión', 'Diabetes tipo II', 'Migraña', 'Ansiedad', 'Dolor lumbar']),
            description: faker.lorem.sentence(),
            notes: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
            severity: rand(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
            clinicalStatus,
            status: rand(['VALID', 'VOID', 'ENTERED_IN_ERROR']),
            diagnosedAt,
            resolvedAt,
        });

        diagnoses.push(diagnosis);

        await DiagnosisUser.create({
            diagnosisId: diagnosis.id,
            userId: users[i % users.length].id,
            role: 'AUTHOR',
        });
    }

    // ===== TREATMENTS =====
    for (let i = 0; i < 120; i++) {
        const patient = patients[i % patients.length];
        const appointment = appointments[i % appointments.length];

        const clinicalStatus = rand(['PLANNED', 'ONGOING', 'GIVEN', 'COMPLETED', 'DISCONTINUED']);
        const devisedAt = daysAgo(rand([5, 20, 60]));

        const resolvedAt = ['COMPLETED', 'DISCONTINUED'].includes(clinicalStatus)
            ? new Date(devisedAt.getTime() + 5 * 86400000)
            : null;

        const treatment = await Treatment.create({
            patientId: patient.id,
            appointmentId: appointment.id,
            name: rand([
                'Terapia farmacológica',
                'Fisioterapia',
                'Dieta controlada',
                'Terapia cognitiva',
                'Tratamiento del dolor',
            ]),
            description: faker.lorem.sentence(),
            notes: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
            duration: rand(['1 semana', '2 semanas', '1 mes', '3 meses']),
            clinicalStatus,
            status: rand(['VALID', 'VOID', 'ENTERED_IN_ERROR']),
            devisedAt,
            resolvedAt,
        });

        await TreatmentUser.create({
            treatmentId: treatment.id,
            userId: users[i % users.length].id,
            role: 'AUTHOR',
        });

        if (i % 2 === 0) {
            const diagnosis = diagnoses[i % diagnoses.length];
            await DiagnosisTreatment.create({
                diagnosisId: diagnosis.id,
                treatmentId: treatment.id,
            });
        }
    }

    console.log('✅ Full deterministic realistic seed completed');
}

module.exports = {
    seed,
};
