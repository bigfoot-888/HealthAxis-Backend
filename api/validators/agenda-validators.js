const { check } = require('express-validator');
const agendaService = require('../../modules/agenda-service');
const ConflictError = require('../../errors/ConflictError');
const ValidationError = require('../../errors/ValidationError');

const createAgendaRules = [
    check('name')
        .notEmpty()
        .withMessage('El nombre de la agenda es obligatorio')
        .custom(async (value) => {
            const existingAgenda = await agendaService.getAgendaByName(value);
            if (existingAgenda) {
                throw new ConflictError('Error, el nombre ya existe', {
                    name: value,
                });
            }
        }),
];

const updateAgendaRules = [
    check('name')
        .notEmpty()
        .withMessage('El nombre de la agenda es obligatorio')
        .custom(async (value, { req }) => {
            const uuid = req.params.uuid; 
            const existingAgenda = await agendaService.getAgendaByName(value, uuid);
            if (existingAgenda) {
                throw new ConflictError('Error, el nombre ya existe', {
                    name: value,
                });
            }
            console.log("hola hola hola")
        }),
]

module.exports = {
    createAgendaRules,
    updateAgendaRules
}

