const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient-controller');

router.post('/new', patientController.createPatientController);

router.post('/import', patientController.importPatientsController);

router.get('/', patientController.getPatientsController);

router.get('/filtered', patientController.getFilteredPatientsController);

router.patch('/deactivate', patientController.deactivatePatientController);
router.patch('/reactivate', patientController.reactivatePatientController);

router.get('/:uuid/flow', patientController.getPatientFlowController);

router.get('/:uuid/detail', patientController.getPatientDetailController);

router.get('/:id', patientController.getPatientController);

router.put('/edit/:id', patientController.updatePatientController);

module.exports = router;
