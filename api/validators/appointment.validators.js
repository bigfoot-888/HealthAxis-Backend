const { check } = require('express-validator');
const appointmentService = require('../../services/appointment.service');
const agendaService = require('../../services/agenda.service');
const userService = require('../../services/user.service');
const patientService = require('../../services/patient.service');
const ConflictError = require('../../errors/ConflictError');
const ValidationError = require('../../errors/ValidationError');
const NotFoundError = require('../../errors/NotFoundError');

const createAppointmentRules = [
    check('reason')
        .notEmpty()
        .withMessage('La razón es obligatoria')
        .isLength({ max: 255 })
        .withMessage('La razón no puede exceder los 255 caracteres'),
    check('notes').optional().isLength({ max: 1000 }).withMessage('Las notas no pueden exceder los 1000 caracteres'),
    check('location').optional().isLength({ max: 100 }).withMessage('La ubicación no puede exceder los 100 caracteres'),
    check('type')
        .notEmpty()
        .withMessage('El tipo de cita es obligatorio')
        .isIn(['IN_PERSON', 'VIRTUAL'])
        .withMessage('El tipo de cita debe ser en persona o virtual'),
    check('startTime')
        .notEmpty()
        .withMessage('La fecha y hora de inicio es obligatoria')
        .isISO8601()
        .withMessage('Fecha de inicio inválida'),
    check('user')
        .notEmpty()
        .withMessage('El usuario es obligatorio'),
    check('patient')
        .notEmpty()
        .withMessage('El paciente es obligatorio')
];

const updateAppointmentRules = [
    check('reason')
        .notEmpty()
        .withMessage('La razón es obligatoria')
        .isLength({ max: 255 })
        .withMessage('La razón no puede exceder los 255 caracteres'),
    check('notes').optional().isLength({ max: 1000 }).withMessage('Las notas no pueden exceder los 1000 caracteres'),
    check('location').optional().isLength({ max: 100 }).withMessage('La ubicación no puede exceder los 100 caracteres'),
    check('type')
        .notEmpty()
        .withMessage('El tipo de cita es obligatorio')
        .isIn(['IN_PERSON', 'VIRTUAL'])
        .withMessage('El tipo de cita debe ser en persona o virtual'),
    check('startTime')
        .notEmpty()
        .withMessage('La fecha y hora de inicio es obligatoria')
        .isISO8601()
        .withMessage('Fecha de inicio inválida'),
];

module.exports = {
    createAppointmentRules,
    updateAppointmentRules,
};
