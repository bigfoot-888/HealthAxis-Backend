
const express = require('express')
const router = express.Router(); 

const userController = require('../controllers/user-controller'); 
const createUserRules = require('../validators/create-user-validator')
const validateRequest = require('../../middlewares/validate-requests');

router.post("/new", createUserRules, validateRequest, userController.createUserController); 

router.post("/import", userController.importUsersController); 

router.get("/", userController.getUsersController); 

router.get("/filtered", userController.getFilteredUsersController);

router.get("/profile", userController.getProfile); 

router.patch("/deactivate", userController.deactivateUserController)
router.patch("/reactivate", userController.reactivateUserController)

router.post("/logout", userController.logout)

router.get("/edit/:id", userController.getUserController); 
router.put("/edit/:id", userController.updateUserController); 


module.exports = router; 