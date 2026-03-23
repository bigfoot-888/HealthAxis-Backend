const express = require('express');
const router = express.Router();

const treatmentController = require('../controllers/treatment-controller');
const {createTreatmentRules} = require('../validators/treatment-validators'); 
const validateRequest = require('../../middlewares/validate-requests');
const asyncHandler = require('../../middlewares/async-handler')

router.post('/new', createTreatmentRules, validateRequest, asyncHandler(treatmentController.createTreatmentController));

router.get('/', asyncHandler(treatmentController.getTreatmentsController));

router.patch('/:uuid/update/state', asyncHandler(treatmentController.updateTreatmentStateController));
router.patch('/:uuid/update/record-state', asyncHandler(treatmentController.updateTreatmentRecordStateController));

router.get('/:uuid', asyncHandler(treatmentController.getTreatmentController));

router.get('/:uuid/plain', asyncHandler(treatmentController.getTreatmentPlainController));

module.exports = router;
