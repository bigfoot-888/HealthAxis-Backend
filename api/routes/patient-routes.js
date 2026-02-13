
const express = require('express')
const router = express.Router(); 

const patientController = require('../controllers/patient-controller'); 

router.post("/new", patientController.createPatientController); 

router.post("/import", patientController.importPatientsController); 

router.get("/", patientController.getPatientsController); 

router.patch("/deactivate", patientController.deactivatePatientController)

router.get("/:id", patientController.getPatientController)

router.put("/edit/:id", patientController.updatePatientController); 

module.exports = router; 