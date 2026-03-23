const express = require('express');
const router = express.Router();

const agendaController = require('../controllers/agenda-controller');
const {updateAgendaRules, createAgendaRules} = require('../validators/agenda-validators'); 
const {updateAgendaPeriodRules, createAgendaPeriodRules} = require('../validators/agenda-period-validators'); 
const validateRequest = require('../../middlewares/validate-requests');

router.post('/new', createAgendaRules, validateRequest, agendaController.createAgendaController);

router.get('/', agendaController.getAgendasController);
router.get('/filtered', agendaController.getFilteredAgendasController);
router.get('/:uuid', agendaController.getAgendaController);

router.get('/edit/:uuid', agendaController.getAgendaController);
router.put('/edit/:uuid', updateAgendaRules, validateRequest, agendaController.updateAgendaController);

router.patch('/deactivate', agendaController.deactivateAgendaController);
router.patch('/reactivate', agendaController.reactivateAgendaController);

router.post('/:uuid/periods/new', createAgendaPeriodRules, validateRequest, agendaController.createAgendaPeriodController); 
router.put('/:uuid/periods/edit/:periodUuid', updateAgendaPeriodRules, validateRequest, agendaController.updateAgendaPeriodController); 

module.exports = router;
