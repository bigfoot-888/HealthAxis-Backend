const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

const requirePermission = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

router.post('/', requirePermission("patient:create"), asyncHandler(patientController.createPatientController));
router.post('/import', requirePermission("patient:create"), asyncHandler(patientController.importPatientsController));

router.get('/', requirePermission("patient:read"), asyncHandler(patientController.getPatientsController));
router.get('/filtered', requirePermission("patient:read"), asyncHandler(patientController.getFilteredPatientsController));

router.get('/:uuid/flow', requirePermission("patient:read"), validateUuidParam('uuid'), asyncHandler(patientController.getPatientFlowController));
router.get('/:uuid/detail', requirePermission("patient:read"), validateUuidParam('uuid'), asyncHandler(patientController.getPatientDetailController));
router.get('/:uuid', requirePermission("patient:read"), validateUuidParam('uuid'), asyncHandler(patientController.getPatientController));

router.put('/:uuid', requirePermission("patient:update"), validateUuidParam('uuid'), asyncHandler(patientController.updatePatientController));

router.patch('/:uuid/deactivate', requirePermission("patient:update"), validateUuidParam('uuid'), asyncHandler(patientController.deactivatePatientController));
router.patch('/:uuid/reactivate', requirePermission("patient:delete"), validateUuidParam('uuid'), asyncHandler(patientController.reactivatePatientController));

module.exports = router;