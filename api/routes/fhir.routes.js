
const express = require('express');
const router = express.Router();

const fhirPatientController = require('../controllers/fhir/fhir.patient.controller');
const fhirConditionController = require('../controllers/fhir/fhir.condition.controller'); 
const fhirProcedureController = require('../controllers/fhir/fhir.procedure.controller')
const fhirPractitionerController = require('../controllers/fhir/fhir.practitioner.controller')
const fhirAppointmentController = require('../controllers/fhir/fhir.appointment.controller')

const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

router.get('/patients/:uuid', validateUuidParam(), asyncHandler(fhirPatientController.getPatient));
router.get('/patients', asyncHandler(fhirPatientController.searchPatients));

router.get('/practitioners/:uuid', validateUuidParam(), asyncHandler(fhirPractitionerController.getPractitioner));
router.get('/practitioners', asyncHandler(fhirPractitionerController.searchPractitioners));

router.get('/conditions/:uuid', validateUuidParam(), fhirConditionController.getCondition);
router.get('/conditions', fhirConditionController.searchConditions);

router.get('/procedures/:uuid', validateUuidParam(), fhirProcedureController.getProcedure);
router.get('/procedures', fhirProcedureController.searchProcedures);

router.get('/appointments/:uuid', validateUuidParam(), fhirAppointmentController.getAppointment);
router.get('/appointments', fhirAppointmentController.searchAppointments);

module.exports = router;
