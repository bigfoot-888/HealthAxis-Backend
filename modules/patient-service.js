const sequelize = require('../config/database');
const { Patient, Appointment, Treatment, Diagnosis, PatientFlow, FlowEvent } = require('../models/index');
const { v4: uuidv4 } = require('uuid');
const { createPrimaryFlowEvent } = require('../utils/flow-event');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const { Op } = require('sequelize');

function createNHC(id, createdAt) {
    const year = new Date(createdAt).getFullYear();
    return `${String(id).padStart(6, '0')}`;
}

async function createPatient(patientData) {
    return sequelize.transaction(async (t) => {
        const patient = await Patient.create(
            {
                ...patientData,
                uuid: uuidv4(),
                nhc: '',
            },
            { transaction: t },
        );
        patient.nhc = createNHC(patient.id, patient.createdAt);
        await patient.save({ transaction: t });

        // On patient creation, create its patient flow
        await PatientFlow.create(
            {
                patientId: patient.id,
            },
            { transaction: t },
        );

        await createPrimaryFlowEvent({
            patientId: patient.id,
            type: 'REGISTRATION',
            title: 'Paciente registrado en el sistema',
            transaction: t,
        });

        return patient;
    });
}

async function getPatients() {
    const patients = await Patient.findAll();
    return patients;
}

// Treat query as a literal string, escaping % and _ characters
const escapeLike = (str) => str.replace(/[%_]/g, '\\$&');

async function getFilteredPatients(query, limit = 20) {
    if (!query || query.length < 2) {
        return [];
    }
    const safeQuery = `%${escapeLike(query)}%`;

    const patients = await Patient.findAll({
        attributes: ['id', 'name', 'surname', 'nhc'],
        where: {
            state: 'ACTIVE',
            [Op.or]: [
                { name: { [Op.iLike]: safeQuery } },
                { surname: { [Op.iLike]: safeQuery } },
                { nhc: { [Op.iLike]: safeQuery } },
            ],
        },
        order: [
            ['surname', 'ASC'],
            ['name', 'ASC'],
        ],
        limit: Math.min(limit, 50),
    });

    return patients;
}

async function getPatient(uuid) {
    const patient = await Patient.findOne({ where: { uuid: uuid } });
    return patient;
}

async function getPatientDetail(uuid) {
    const patient = await Patient.findOne({
        where: { uuid: uuid },
        include: [
            { model: Appointment, as: 'appointments' },
            { model: Diagnosis, as: 'diagnoses' },
            { model: Treatment, as: 'treatments' },
        ],
        nest: true,
    });

    if (patient === null) throw new NotFoundError('Error, paciente no encontrado', { uuid });

    return patient;
}

async function getPatientByIdPlain(id) {
    const patient = await Patient.findByPk(id);
    if (patient === null) throw new NotFoundError('Error, paciente no encontrado', { id });
    return patient;
}

async function getPatientFlow(uuid) {
    return sequelize.transaction(async (t) => {
        const patient = await Patient.findOne({ where: { uuid }, transaction: t });

        if (!patient) {
            throw new NotFoundError('Paciente no encontrado', { uuid });
        }

        const flow = await PatientFlow.findOne({
            where: { patientId: patient.id },
            include: [
                {
                    model: FlowEvent,
                    as: 'events',
                },
            ],
            transaction: t,
        });

        if (!flow) {
            throw new NotFoundError('Flujo de paciente no encontrado', { patientId: patient.id });
        }

        const events = flow.events || [];

        const groupedIds = {
            APPOINTMENT: [],
            DIAGNOSIS: [],
            TREATMENT: [],
        };

        for (const event of events) {
            if (event.entityId && groupedIds[event.type]) {
                groupedIds[event.type].push(event.entityId);
            }
        }

        const [appointments, diagnoses, treatments] = await Promise.all([
            Appointment.findAll({
                where: { id: groupedIds.APPOINTMENT },
                transaction: t,
            }),
            Diagnosis.findAll({
                where: { id: groupedIds.DIAGNOSIS },
                transaction: t,
            }),
            Treatment.findAll({
                where: { id: groupedIds.TREATMENT },
                transaction: t,
            }),
        ]);

        const appointmentMap = Object.fromEntries(appointments.map((a) => [a.id, a]));

        const diagnosisMap = Object.fromEntries(diagnoses.map((d) => [d.id, d]));

        const treatmentMap = Object.fromEntries(treatments.map((t) => [t.id, t]));

        const nodes = events.map((event) => {
            let entity = null;

            if (event.type === 'APPOINTMENT') {
                entity = appointmentMap[event.entityId];
            } else if (event.type === 'DIAGNOSIS') {
                entity = diagnosisMap[event.entityId];
            } else if (event.type === 'TREATMENT') {
                entity = treatmentMap[event.entityId];
            }

            return {
                id: String(event.id),
                type: event.type,
                data: {
                    label: event.title,
                    type: event.type,
                    role: event.role,
                    entity,
                },
                position: {
                    x: event.positionX ?? 0,
                    y: event.positionY ?? 0,
                },
            };
        });

        const edges = events
            .filter((event) => event.parentEventId)
            .map((event) => ({
                id: `e-${event.parentEventId}-${event.id}`,
                source: String(event.parentEventId),
                target: String(event.id),
                type: event.role === 'PRIMARY' ? 'smoothstep' : 'default',
            }));

        return {
            flowId: flow.id,
            nodes,
            edges,
        };
    });
}

async function deactivatePatient(id) {
    return sequelize.transaction(async (t) => {
        const [count] = await Patient.update({ state: 'INACTIVE' }, { where: { id }, transaction: t });

        if (count === 0) {
            throw new NotFoundError('Error, el usuario no ha podido ser desactivado', { userId: id });
        }

        await createPrimaryFlowEvent({
            patientId: id,
            type: 'DEACTIVATION',
            title: 'Paciente dado de baja',
            transaction: t,
        });

        return count;
    });
}

async function reactivatePatient(id) {
    return sequelize.transaction(async (t) => {
        const [count] = await Patient.update({ state: 'ACTIVE' }, { where: { id }, transaction: t });

        if (count === 0) {
            throw new NotFoundError('Error, el paciente no ha podido ser reactivado', { userId: id });
        }

        await createPrimaryFlowEvent({
            patientId: id,
            type: 'REACTIVATION',
            title: 'Paciente reactivado en el sistema',
            transaction: t,
        });

        return count;
    });
}

async function importPatients(patients) {
    for (const patient of patients) {
        try {
            const uuid = uuidv4();
            await Patient.create({ ...patient, uuid });
        } catch (err) {
            throw new AppError('Error al procesar los pacientes importados', 500, {
                originalMessage: err.message,
                user: user.email,
            });
        }
    }
    return patients;
}

async function updatePatient(uuid, patientData) {
    const [count] = await Patient.update({ ...patientData }, { where: { uuid: uuid } });
    if (count === 0)
        throw new NotFoundError('Error, no se han podido editar los datos del paciente', { patientId: id });
    return count;
}

module.exports = {
    createPatient,
    getPatients,
    importPatients,
    getPatient,
    deactivatePatient,
    getPatientByIdPlain,
    reactivatePatient,
    updatePatient,
    getFilteredPatients,
    getPatientDetail,
    getPatientFlow,
};
