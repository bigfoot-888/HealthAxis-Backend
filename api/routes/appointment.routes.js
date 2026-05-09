const express = require('express');
const router = express.Router();

const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

const appointmentController = require('../controllers/appointment.controller');
const { createAppointmentRules, updateAppointmentRules } = require('../validators/appointment.validators');

const validateRequest = require('../../middlewares/request-validator.middleware');

const {requirePermission} = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

router.post(
    '/',
    requirePermission("appointment:create"),
    createAppointmentRules,
    validateRequest,
    asyncHandler(appointmentController.createAppointmentController),
);

router.post(
    '/:uuid/complete',
    requirePermission("appointment:complete"),
    validateRequest,
    asyncHandler(appointmentController.completeAppointmentWithClinicalData),
);

router.get('/', requirePermission("appointment:read"), asyncHandler(appointmentController.getAppointmentsController));
router.get('/me', requirePermission("appointment:read"), asyncHandler(appointmentController.getMyAppointmentsController));
router.get('/filtered', requirePermission("appointment:read"), asyncHandler(appointmentController.getFilteredAppointmentsController));
router.get('/:uuid', requirePermission("appointment:read"), validateUuidParam('uuid'), asyncHandler(appointmentController.getAppointmentController));
router.get(
    '/:uuid/plain',
    requirePermission("appointment:read"), 
    validateUuidParam('uuid'),
    asyncHandler(appointmentController.getAppointmentPlainController),
);

router.put(
    '/:uuid',
    requirePermission("appointment:update"), 
    validateUuidParam('uuid'),
    updateAppointmentRules,
    validateRequest,
    asyncHandler(appointmentController.updateAppointmentController),
);

router.patch(
    '/:uuid/status',
    requirePermission("appointment:update"), 
    validateUuidParam('uuid'),
    asyncHandler(appointmentController.updateAppointmentStatusController),
);

module.exports = router;
