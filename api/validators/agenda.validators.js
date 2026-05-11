const { check } = require('express-validator');
const agendaService = require('../../services/agenda.service');
const ConflictError = require('../../errors/ConflictError');
const ValidationError = require('../../errors/ValidationError');

const createAgendaRules = [
    check('name')
        .notEmpty()
        .withMessage('El nombre de la agenda es obligatorio')
        .isLength({ max: 50 })
        .withMessage('Máximo 50 caracteres'),
    check('openingDate')
        .notEmpty()
        .withMessage('La fecha de apertura es obligatorio')
        .isISO8601()
        .withMessage('Fecha de apertura inválida'),
    check('closingDate')
        .notEmpty()
        .withMessage('La fecha de cierre es obligatorio')
        .isISO8601()
        .withMessage('Fecha de cierre inválida'),
];

const updateAgendaRules = [
    check('name')
        .notEmpty()
        .withMessage('El nombre de la agenda es obligatorio')
        .isLength({ max: 50 })
        .withMessage('Máximo 50 caracteres'),
];

module.exports = {
    createAgendaRules,
    updateAgendaRules
}

