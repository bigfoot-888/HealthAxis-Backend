const express = require('express');
const router = express.Router();

const agendaController = require('../controllers/agenda.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

const { updateAgendaRules, createAgendaRules } = require('../validators/agenda.validators');
const { updateAgendaPeriodRules, createAgendaPeriodRules } = require('../validators/agenda-period.validators');
const validateRequest = require('../../middlewares/request-validator.middleware');

const {requirePermission} = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

router.post('/', requirePermission("agenda:create"), createAgendaRules, validateRequest, asyncHandler(agendaController.createAgendaController));

router.get('/', requirePermission("agenda:read"), asyncHandler(agendaController.getAgendasController));
router.get('/filtered', requirePermission("agenda:read"), asyncHandler(agendaController.getFilteredAgendasController));
router.get('/:uuid', requirePermission("agenda:read"), validateUuidParam('uuid'), asyncHandler(agendaController.getAgendaController));

router.put(
    '/:uuid',
    requirePermission("agenda:update"), 
    validateUuidParam('uuid'),
    updateAgendaRules,
    validateRequest,
    asyncHandler(agendaController.updateAgendaController),
);

router.patch('/:uuid/deactivate', requirePermission("agenda:delete"), validateUuidParam('uuid'), asyncHandler(agendaController.deactivateAgendaController));
router.patch('/:uuid/reactivate', requirePermission("agenda:update"), validateUuidParam('uuid'), asyncHandler(agendaController.reactivateAgendaController));

// Agenda Period routes

router.post(
    '/:uuid/periods',
    requirePermission("agenda:create"),
    validateUuidParam('uuid'),
    createAgendaPeriodRules,
    validateRequest,
    asyncHandler(agendaController.createAgendaPeriodController),
);

router.patch(
    '/:agendaUuid/periods/:periodUuid',
    requirePermission("agenda:update"),
    validateUuidParam('agendaUuid'),
    validateUuidParam('periodUuid'),
    updateAgendaPeriodRules,
    validateRequest,
    asyncHandler(agendaController.updateAgendaPeriodStatusController),
);

module.exports = router;
