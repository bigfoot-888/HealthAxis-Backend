const { check } = require('express-validator');
const ValidationError = require('../../errors/ValidationError');
const userService = require('../../services/user.service');
const patientService = require('../../services/patient.service');
const appointmentService = require('../../services/appointment.service');
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

    check('users').isArray({ min: 1 }).withMessage('Debe haber al menos un profesional'),

    check('patient').notEmpty().withMessage('El paciente es obligatorio').isInt().withMessage('Paciente inválido'),

    check('description').optional().isLength({ max: 1000 }),

    check('notes').optional().isLength({ max: 2000 }),

    check('appointment.id').optional().isInt().withMessage('Cita inválida'),
];

module.exports = {
    createDiagnosisRules,
};
