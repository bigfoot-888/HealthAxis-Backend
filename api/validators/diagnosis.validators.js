const { check } = require('express-validator');
const ValidationError = require('../../errors/ValidationError');
const userService = require('../../services/user.service');
const patientService = require('../../services/patient.service');
const NotFoundError = require('../../errors/NotFoundError');

const createDiagnosisRules = [
    check('name')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 100 })
        .withMessage('El nombre no puede superar los 100 caracteres'),
    check('severity')
        .notEmpty()
        .withMessage('La gravedad es obligatoria')
        .isIn(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'])
        .withMessage('La gravedad del diagnosis debe ser baja, moderada, alta, o crítica'),
    check('diagnosedAt').notEmpty().withMessage('La fecha del diagnóstico es obligatoria'),
    check('users')
        .notEmpty()
        .withMessage('Los profesionales involucrados son obligatorios')
        .custom(async (users) => {
            try {
                for (const user of users) {
                    await userService.getUserById(user.user.id);
                }
                return true;
            } catch (error) {
                if (error instanceof NotFoundError) {
                    throw new ValidationError('El usuario especificado no existe', { users: users });
                }
                throw error;
            }
        }),
    check('patient')
        .notEmpty()
        .withMessage('El paciente es obligatorio')
        .custom(async (patient) => {
            try {
                await patientService.getPatientById(patient.id);
                return true;
            } catch (error) {
                if (error instanceof NotFoundError) {
                    throw new ValidationError('El paciente especificado no existe', { patient: patient });
                }
                throw error;
            }
        }),
];

module.exports = {
    createDiagnosisRules,
};
