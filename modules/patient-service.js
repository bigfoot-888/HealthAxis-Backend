const sequelize = require('../config/database');
const Patient = require('../models/patient-model');
const { v4: uuidv4 } = require('uuid');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');

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
        return patient;
    });
}

async function getPatients() {
    const patients = await Patient.findAll();
    return patients;
}

async function getPatient(uuid) {
    const patient = await Patient.findOne({ where: { uuid: uuid } });
    return patient;
}

async function deactivatePatient(id) {
    const [count] = await Patient.update(
        { state: 'INACTIVE' },
        {
            where: {
                id: id,
            },
        },
    );
    if (count === 0)
        throw new NotFoundError(
            'Error, el usuario no ha podido ser desactivado',
            { userId: id },
        );
    return count;
}

async function reactivatePatient(id) {
    const [count] = await Patient.update(
        { state: 'ACTIVE' },
        {
            where: {
                id: id,
            },
        },
    );
    if (count === null)
        throw new NotFoundError(
            'Error, el paciente no ha podido ser reactivado',
            { userId: id },
        );
    return count;
}

async function importPatients(patients) {
    for (const patient of patients) {
        try {
            const uuid = uuidv4();
            await Patient.create({ ...patient, uuid });
        } catch (err) {
            throw new AppError(
                'Error al procesar los pacientes importados',
                500,
                { originalMessage: err.message, user: user.email },
            );
        }
    }
    return patients;
}

async function updatePatient(uuid, patientData) {
    const [count] = await Patient.update(
        { ...patientData },
        { where: { uuid: uuid } },
    );
    if (count === 0)
        throw new NotFoundError(
            'Error, no se han podido editar los datos del paciente',
            { patientId: id },
        );
    return count;
}

module.exports = {
    createPatient,
    getPatients,
    importPatients,
    getPatient,
    deactivatePatient,
    reactivatePatient,
    updatePatient,
};
