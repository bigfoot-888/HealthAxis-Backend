const { check } = require('express-validator');
const userService = require('../../services/user.service');
const ConflictError = require('../../errors/ConflictError');

const createUserRules = [
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

    check('email')
        .notEmpty()
        .withMessage('El correo es obligatorio')
        .isEmail()
        .withMessage('Formato inválido. Ejemplo: nombre@ejemplo.com')
        .isLength({ max: 100 })
        .withMessage('Máximo 100 caracteres')
        .custom(async (value) => {
            const existingUser = await userService.getUserByEmail(value);
            if (existingUser) {
                throw new ConflictError('Error, el correo ya existe', {
                    email: value,
                });
            }
        }),

    check('password')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
        .isLength({ min: 6, max: 255 })
        .withMessage('Debe tener entre 6 y 255 caracteres'),

    check('phone')
        .notEmpty()
        .withMessage('El teléfono es obligatorio')
        .isLength({ max: 20 })
        .withMessage('Máximo 20 caracteres')
        .matches(/^[0-9+()\s-]+$/)
        .withMessage('Formato inválido. Ejemplo: 612345678 o +34 612 345 678'),

    check('agenda.id').notEmpty().withMessage('La agenda es obligatoria').isInt().withMessage('Agenda inválida'),

    check('roles').optional().isArray().withMessage('Roles debe ser un array'),

    check('roles.*').optional().isString().withMessage('Rol inválido'),
];

const updateUserRules = [
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

    check('email')
        .notEmpty()
        .withMessage('El correo es obligatorio')
        .isEmail()
        .withMessage('Formato inválido. Ejemplo: nombre@ejemplo.com')
        .isLength({ max: 100 })
        .withMessage('Máximo 100 caracteres')
        .custom(async (value, { req }) => {
            const existingUser = await userService.getUserByEmail(value);

            if (existingUser && existingUser.uuid !== req.params.uuid) {
                throw new ConflictError('Error, el correo ya existe', {
                    email: value,
                });
            }
        }),

    check('phone')
        .notEmpty()
        .withMessage('El teléfono es obligatorio')
        .isLength({ max: 20 })
        .withMessage('Máximo 20 caracteres')
        .matches(/^[0-9+()\s-]+$/)
        .withMessage('Formato inválido. Ejemplo: 612345678 o +34 612 345 678'),

    check('agenda.id').notEmpty().withMessage('La agenda es obligatoria').isInt().withMessage('Agenda inválida'),

    check('roles').optional().isArray().withMessage('Roles debe ser un array'),

    check('roles.*').optional().isString().withMessage('Rol inválido'),
];

const changePasswordRules = [
    check('currentPassword').notEmpty().withMessage('La contraseña actual es obligatoria'),

    check('newPassword')
        .notEmpty()
        .withMessage('La nueva contraseña es obligatoria')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .isLength({ max: 255 })
        .withMessage('Máximo 255 caracteres'),
];

module.exports = { createUserRules, updateUserRules, changePasswordRules };
