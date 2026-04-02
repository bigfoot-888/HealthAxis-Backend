const express = require('express');
const router = express.Router();

const treatmentController = require('../controllers/treatment.controller');
const { createTreatmentRules } = require('../validators/treatment.validators'); 
const validateRequest = require('../../middlewares/request-validator.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');

router.post('/', createTreatmentRules, validateRequest, asyncHandler(treatmentController.createTreatmentController));

router.get('/', asyncHandler(treatmentController.getTreatmentsController));
router.get('/:uuid', asyncHandler(treatmentController.getTreatmentController));
router.get('/:uuid/plain', asyncHandler(treatmentController.getTreatmentPlainController));

router.patch('/:uuid/clinical-status', asyncHandler(treatmentController.updateTreatmentClinicalStatusController));
router.patch('/:uuid/status', asyncHandler(treatmentController.updateTreatmentStatusController));

module.exports = router;