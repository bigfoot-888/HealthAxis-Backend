const { check } = require('express-validator');
const ValidationError = require('../../errors/ValidationError');
const userService = require('../../services/user.service');
const NotFoundError = require('../../errors/NotFoundError');

const createClinicalDocumentRules = [
    check('title')
        .notEmpty()
        .withMessage('El título del documento es obligatorio')
        .isLength({ max: 100 })
        .withMessage('El título no puede superar los 100 caracteres'),
    check('documentType')
        .notEmpty()
        .withMessage('El tipo del documento es obligatorio')
        .isIn(['CLINICAL_SUMMARY', 'PROGRESS_NOTE', 'CONSULT_NOTE', 'EXTERNAL_FILE', 'OTHER'])
        .withMessage(
            'El tipo de documento debe estar entre: resumen clínico, nota de progreso, nota de consulta, archivo externo, y otros',
        ),
    check('content')
        .optional()
        .custom((value) => {
            if (typeof value === 'object') return true;
            try {
                JSON.parse(value);
                return true;
            } catch {
                throw new ValidationError('El contenido debe ser JSON válido', { content: value });
            }
        }),
    check('users')
        .notEmpty()
        .withMessage('Los profesionales involucrados son obligatorios')
        .custom(async (users) => {
            try {
                for (const user of users) {
                    console.log(user.user.id)
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
];

const editClinicalDocumentRules = [
    check('title')
        .notEmpty()
        .withMessage('El título del documento es obligatorio')
        .isLength({ max: 100 })
        .withMessage('El título no puede superar los 100 caracteres'),
]

const createClinicalAttachmentRules = [
    check('fileName')
        .notEmpty()
        .withMessage('El nombre del archivo es obligatorio')
        .isLength({ max: 100 })
        .withMessage('El nombre del archivo no puede superar los 100 caracteres'),
    check('fileSize')
        .notEmpty()
        .withMessage('El tamaño del archivo es obligatorio')
        .isInt({ max: 20 * 1024 * 1024 })
        .withMessage('El tamaño del archivo no puede superar los 20 MB'),
]

module.exports = {
    createClinicalDocumentRules,
    editClinicalDocumentRules,
    createClinicalAttachmentRules
};
