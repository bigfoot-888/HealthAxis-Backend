const express = require('express');
const router = express.Router();

const diagnosisController = require('../controllers/diagnosis.controller');
const { createDiagnosisRules } = require('../validators/diagnosis.validators');
const validateRequest = require('../../middlewares/request-validator.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

// ===== CREATE =====
router.post('/', createDiagnosisRules, validateRequest, asyncHandler(diagnosisController.createDiagnosisController));

// ===== READ =====
router.get('/', asyncHandler(diagnosisController.getDiagnosesController));
router.get('/filtered', asyncHandler(diagnosisController.getFilteredDiagnosesController));

router.get('/:uuid', validateUuidParam('uuid'), asyncHandler(diagnosisController.getDiagnosisController));
router.get('/:uuid/plain', validateUuidParam('uuid'), asyncHandler(diagnosisController.getDiagnosisPlainController));

// ===== UPDATE =====
router.patch(
    '/:uuid/clinical-status',
    validateUuidParam('uuid'),
    asyncHandler(diagnosisController.updateDiagnosisClinicalStatusController),
);

router.patch(
    '/:uuid/status',
    validateUuidParam('uuid'),
    asyncHandler(diagnosisController.updateDiagnosisRecordStatusController),
);

module.exports = router;
