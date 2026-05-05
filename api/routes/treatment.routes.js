const express = require('express');
const router = express.Router();

const treatmentController = require('../controllers/treatment.controller');
const { createTreatmentRules, editTreatmentRules } = require('../validators/treatment.validators'); 
const validateRequest = require('../../middlewares/request-validator.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');

const {requirePermission} = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

router.post('/', requirePermission("treatment:create"), createTreatmentRules, validateRequest, asyncHandler(treatmentController.createTreatmentController));

router.get('/', requirePermission("treatment:read"), asyncHandler(treatmentController.getTreatmentsController));
router.get('/:uuid', requirePermission("treatment:read"), asyncHandler(treatmentController.getTreatmentController));
router.get('/:uuid/plain', requirePermission("treatment:read"), asyncHandler(treatmentController.getTreatmentPlainController));

router.put('/:uuid', requirePermission("treatment:update"), editTreatmentRules, asyncHandler(treatmentController.updateTreatmentController));

router.patch('/:uuid/clinical-status', requirePermission("treatment:update"), asyncHandler(treatmentController.updateTreatmentClinicalStatusController));
router.patch('/:uuid/status', requirePermission("treatment:update"), asyncHandler(treatmentController.updateTreatmentStatusController));

module.exports = router;