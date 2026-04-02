const { check } = require('express-validator');
const userService = require('../../services/user.service');
const ConflictError = require('../../errors/ConflictError');

const createUserRules = [
    check('name').notEmpty().withMessage('El nombre es obligatorio'),
    check('surname').notEmpty().withMessage('El apellido es obligatorio'),
    check('email')
        .isEmail()
        .withMessage('El correo debe tener un formato válido')
        .custom(async (value) => {
            const existingUser = await userService.getUserByEmail(value);
            if (existingUser) {
                throw new ConflictError('Error, el correo ya existe', {
                    email: value,
                });
            }
        }),
    check('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    check('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Teléfono no válido'),
];

module.exports = createUserRules;
