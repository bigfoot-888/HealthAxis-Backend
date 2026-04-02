const express = require('express');
const router = express.Router();

const agendaController = require('../controllers/agenda.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

const { updateAgendaRules, createAgendaRules } = require('../validators/agenda.validators');
const { updateAgendaPeriodRules, createAgendaPeriodRules } = require('../validators/agenda-period.validators');
const validateRequest = require('../../middlewares/request-validator.middleware');

router.post('/', createAgendaRules, validateRequest, asyncHandler(agendaController.createAgendaController));

router.get('/', asyncHandler(agendaController.getAgendasController));
router.get('/filtered', asyncHandler(agendaController.getFilteredAgendasController));
router.get('/:uuid', validateUuidParam('uuid'), asyncHandler(agendaController.getAgendaController));

router.put(
    '/:uuid',
    validateUuidParam('uuid'),
    updateAgendaRules,
    validateRequest,
    asyncHandler(agendaController.updateAgendaController),
);

router.patch('/:uuid/deactivate', validateUuidParam('uuid'), asyncHandler(agendaController.deactivateAgendaController));
router.patch('/:uuid/reactivate', validateUuidParam('uuid'), asyncHandler(agendaController.reactivateAgendaController));

// Agenda Period routes

router.post(
    '/:uuid/periods',
    validateUuidParam('uuid'),
    createAgendaPeriodRules,
    validateRequest,
    asyncHandler(agendaController.createAgendaPeriodController),
);

router.put(
    '/:uuid/periods/:periodUuid',
    validateUuidParam('uuid'),
    validateUuidParam('periodUuid'),
    updateAgendaPeriodRules,
    validateRequest,
    asyncHandler(agendaController.updateAgendaPeriodController),
);

module.exports = router;
