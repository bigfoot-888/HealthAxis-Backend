const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middlewares/async-handler');


const appointmentController = require('../controllers/appointment-controller');
const {createAppointmentRules, editAppointmentRules} = require('../validators/appointment-validators'); 
const validateRequest = require('../../middlewares/validate-requests');

router.get("/filtered", asyncHandler(appointmentController.getFilteredAppointmentsController));


router.post('/new', createAppointmentRules, validateRequest, appointmentController.createAppointmentController);

router.get('/', appointmentController.getAppointmentsController);
router.get('/:uuid', appointmentController.getAppointmentController);

router.get('/:uuid/plain', appointmentController.getAppointmentPlainController);

router.get('/edit/:uuid', appointmentController.getAppointmentController);
router.put('/edit/:uuid', editAppointmentRules, validateRequest, appointmentController.updateAppointmentController);

router.patch('/:uuid/update', appointmentController.updateAppointmentStateController);


module.exports = router;
