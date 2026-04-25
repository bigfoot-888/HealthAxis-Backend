const { check } = require('express-validator');
const patientService = require('../../services/patient.service');
const ConflictError = require('../../errors/ConflictError');

const createPatientRules = [
    check('name')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 50 })
        .withMessage('Máximo 50 caracteres'),

    check('surname')
        .notEmpty()
        .withMessage('El apellido es obligatorio')
        .isLength({ max: 60 })
        .withMessage('Máximo 60 caracteres'),

    check('sex').notEmpty().withMessage('El sexo es obligatorio').isIn(['MALE', 'FEMALE']).withMessage('Sexo inválido'),

    check('dni')
        .optional()
        .matches(/^[0-9]{8}[A-Z]$/)
        .withMessage('Formato inválido. Ejemplo: 12345678A')
        .custom(async (value) => {
            const existing = await patientService.getPatientByDni(value);
            if (existing) {
                throw new ConflictError('El DNI ya existe', { dni: value });
            }
        }),

    check('email')
        .isEmail()
        .withMessage('Formato de correo inválido')
        .isLength({ max: 100 })
        .withMessage('Máximo 100 caracteres'),

    check('phone')
        .matches(/^[0-9+()\s-]+$/)
        .withMessage('Formato de teléfono inválido'),

    check('addressLine1').notEmpty().withMessage('La dirección es obligatoria'),

    check('dateOfBirth').isISO8601().withMessage('Fecha inválida'),
];

module.exports = { createPatientRules };
