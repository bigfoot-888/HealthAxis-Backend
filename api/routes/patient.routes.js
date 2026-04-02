const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

router.post('/', asyncHandler(patientController.createPatientController));
router.post('/import', asyncHandler(patientController.importPatientsController));

router.get('/', asyncHandler(patientController.getPatientsController));
router.get('/filtered', asyncHandler(patientController.getFilteredPatientsController));

router.get('/:uuid/flow', validateUuidParam('uuid'), asyncHandler(patientController.getPatientFlowController));
router.get('/:uuid/detail', validateUuidParam('uuid'), asyncHandler(patientController.getPatientDetailController));
router.get('/:uuid', validateUuidParam('uuid'), asyncHandler(patientController.getPatientController));

router.put('/:uuid', validateUuidParam('uuid'), asyncHandler(patientController.updatePatientController));

router.patch('/:uuid/deactivate', validateUuidParam('uuid'), asyncHandler(patientController.deactivatePatientController));
router.patch('/:uuid/reactivate', validateUuidParam('uuid'), asyncHandler(patientController.reactivatePatientController));

module.exports = router;