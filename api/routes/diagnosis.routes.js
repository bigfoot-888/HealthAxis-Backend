const express = require('express');
const router = express.Router();

const diagnosisController = require('../controllers/diagnosis.controller');
const { createDiagnosisRules } = require('../validators/diagnosis.validators');
const validateRequest = require('../../middlewares/request-validator.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

const {requirePermission} = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

// ===== CREATE =====
router.post('/', requirePermission("diagnosis:create"), createDiagnosisRules, validateRequest, asyncHandler(diagnosisController.createDiagnosisController));

// ===== READ =====
router.get('/', requirePermission("diagnosis:read"), asyncHandler(diagnosisController.getDiagnosesController));
router.get('/filtered', requirePermission("diagnosis:read"), asyncHandler(diagnosisController.getFilteredDiagnosesController));

router.get('/:uuid', requirePermission("diagnosis:read"), validateUuidParam('uuid'), asyncHandler(diagnosisController.getDiagnosisController));
router.get('/:uuid/plain', requirePermission("diagnosis:read"), validateUuidParam('uuid'), asyncHandler(diagnosisController.getDiagnosisPlainController));

// ===== UPDATE =====
router.patch(
    '/:uuid/clinical-status',
    requirePermission("diagnosis:update"), 
    validateUuidParam('uuid'),
    asyncHandler(diagnosisController.updateDiagnosisClinicalStatusController),
);

router.patch(
    '/:uuid/status',
    requirePermission("diagnosis:update"), 
    validateUuidParam('uuid'),
    asyncHandler(diagnosisController.updateDiagnosisRecordStatusController),
);

module.exports = router;
