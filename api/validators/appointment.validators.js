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
        .custom((value) => {
            const startTime = new Date(value);

            if (isNaN(startTime)) {
                throw new ValidationError('Fecha inválida', { startTime: value });
            }

            return true;
        }),
    check('user')
        .notEmpty()
        .withMessage('El usuario es obligatorio')
        .custom(async (value) => {
            try {
                await userService.getUserById(value.id);
                return true;
            } catch (error) {
                if (error instanceof NotFoundError) {
                    throw new ValidationError('El usuario especificado no existe', { user: value });
                }
                throw error;
            }
        }),
    check('patient')
        .notEmpty()
        .withMessage('El paciente es obligatorio')
        .custom(async (value) => {
            try {
                await patientService.getPatientById(value.id);
                return true;
            } catch (error) {
                if (error instanceof NotFoundError) {
                    throw new ValidationError('El paciente especificado no existe', { patient: value });
                }
                throw error;
            }
        }),
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
        .custom((value) => {
            const startTime = new Date(value);
            const today = new Date();
            if (startTime < today) {
                throw new ValidationError('La fecha y hora de inicio no puede ser anterior a la fecha y hora actual', {
                    startTime: value,
                });
            }

            return true;
        }),
];

module.exports = {
    createAppointmentRules,
    updateAppointmentRules,
};
