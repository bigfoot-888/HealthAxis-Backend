const express = require('express');
const router = express.Router();

const diagnosisController = require('../controllers/diagnosis-controller');
const {createDiagnosisRules} = require('../validators/diagnosis-validators'); 
const validateRequest = require('../../middlewares/validate-requests');
const asyncHandler = require('../../middlewares/async-handler')

router.post('/new', createDiagnosisRules, validateRequest, asyncHandler(diagnosisController.createDiagnosisController));

router.get('/', asyncHandler(diagnosisController.getDiagnosesController));

router.get("/filtered", asyncHandler(diagnosisController.getFilteredDiagnosesController));

router.patch('/:uuid/update/state', asyncHandler(diagnosisController.updateDiagnosisStateController));
router.patch('/:uuid/update/record-state', asyncHandler(diagnosisController.updateDiagnosisRecordStateController));

router.get('/:uuid', asyncHandler(diagnosisController.getDiagnosisController));

router.get('/:uuid/plain', asyncHandler(diagnosisController.getDiagnosisPlainController));


module.exports = router;
