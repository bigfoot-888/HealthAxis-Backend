

const express = require('express')
const router = express.Router(); 

const userController = require('../controllers/user.controller'); 

router.post("/login", userController.validateLogin); 
router.get("/check", userController.checkSession)

module.exports = router; 