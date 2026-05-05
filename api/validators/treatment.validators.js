const { check } = require('express-validator');
const ValidationError = require('../../errors/ValidationError');
const userService = require('../../services/user.service');
const patientService = require('../../services/patient.service');
const NotFoundError = require('../../errors/NotFoundError');

const createTreatmentRules = [
    check('name')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 100 })
        .withMessage('El nombre no puede superar los 100 caracteres'),
    check('users').isArray({ min: 1 }).withMessage('Debe haber al menos un profesional'),

    check('patient.id').notEmpty().withMessage('El paciente es obligatorio').isInt().withMessage('Paciente inválido'),
    check('description').optional().isLength({ max: 1000 }),

    check('notes').optional().isLength({ max: 2000 }),

    check('appointment.id').optional().isInt().withMessage('Cita inválida'),
];

const editTreatmentRules = [
    check('name')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 100 })
        .withMessage('El nombre no puede superar los 100 caracteres'),

    check('users').isArray({ min: 1 }).withMessage('Debe haber al menos un profesional'),

    check('description').optional().isLength({ max: 1000 }),

    check('notes').optional().isLength({ max: 2000 }),

    check('appointment.id').optional().isInt().withMessage('Cita inválida'),
];

module.exports = {
    createTreatmentRules,
    editTreatmentRules
};
