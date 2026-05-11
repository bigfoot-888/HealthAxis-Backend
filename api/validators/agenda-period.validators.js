const { check } = require('express-validator');
const ValidationError = require('../../errors/ValidationError');

const createAgendaPeriodRules = [
    check('openingDate')
        .notEmpty()
        .withMessage('La fecha de apertura es obligatoria')
        .isISO8601()
        .withMessage('Fecha de apertura inválida'),
    check('closingDate')
        .notEmpty()
        .withMessage('La fecha de cierre es obligatoria')
        .isISO8601()
        .withMessage('Fecha de cierre inválida'),
];

const updateAgendaPeriodRules = [
    check('agendaStatus')
        .notEmpty()
        .withMessage('El nuevo estado es obligatorio')
        .isIn(['OPEN', 'CLOSED', 'CANCELLED'])
        .withMessage('El nuevo estado debe ser abierto, cerrado, o cancelado'),
];

module.exports = {
    createAgendaPeriodRules,
    updateAgendaPeriodRules,
}
