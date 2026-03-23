const { check } = require('express-validator');
const ValidationError = require('../../errors/ValidationError');
const userService = require('../../modules/user-service');
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
                     await userService.getUserByIdPlain(user.user.id);
                }
                return true;
            } catch (error) {
                if (error instanceof NotFoundError) {
                    throw new ValidationError('El usuario especificado no existe', { users: users });
                }
                throw error;
            }
        }),
    // check('state')
    //     .notEmpty()
    //     .withMessage('El estado del documento es obligatorio')
    //     .isIn(['DRAFTED', "FINAL", "AMENDED", "ARCHIVED", "VOID"])
    //     .withMessage('El estado del documento debe estar entre: redactado, final, modificado, archivado, y nulo'),
];

const createClinicalDocumentEntityRules = [
        check('entityType')
        .notEmpty()
        .withMessage('El tipo de entidad asociado a un documento es obligatorio')
        .isIn(['DIAGNOSIS', 'TREATMENT', "APPOINTMENT"])
        .withMessage(
            'El tipo de entidad asociado a un documento debe estar entre: diagnóstico, tratamiento, y cita',
        ),
];

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
    createClinicalDocumentEntityRules,
    createClinicalAttachmentRules
};
