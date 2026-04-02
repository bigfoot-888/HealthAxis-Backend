const express = require('express');
const router = express.Router();

const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

const appointmentController = require('../controllers/appointment.controller');
const { createAppointmentRules, editAppointmentRules } = require('../validators/appointment.validators');

const validateRequest = require('../../middlewares/request-validator.middleware');

router.post(
    '/',
    createAppointmentRules,
    validateRequest,
    asyncHandler(appointmentController.createAppointmentController),
);

router.get('/', asyncHandler(appointmentController.getAppointmentsController));
router.get('/filtered', asyncHandler(appointmentController.getFilteredAppointmentsController));
router.get('/:uuid', validateUuidParam('uuid'), asyncHandler(appointmentController.getAppointmentController));
router.get(
    '/:uuid/plain',
    validateUuidParam('uuid'),
    asyncHandler(appointmentController.getAppointmentPlainController),
);

router.put(
    '/:uuid',
    validateUuidParam('uuid'),
    editAppointmentRules,
    validateRequest,
    asyncHandler(appointmentController.updateAppointmentController),
);

router.patch(
    '/:uuid/status',
    validateUuidParam('uuid'),
    asyncHandler(appointmentController.updateAppointmentStatusController),
);

module.exports = router;
