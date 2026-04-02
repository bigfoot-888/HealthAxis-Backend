const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const createUserRules = require('../validators/user.validators');
const validateRequest = require('../../middlewares/request-validator.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

router.post('/', createUserRules, validateRequest, asyncHandler(userController.createUserController));
router.post('/import', asyncHandler(userController.importUsersController));

router.get('/', asyncHandler(userController.getUsersController));
router.get('/filtered', asyncHandler(userController.getFilteredUsersController));
router.get('/profile', asyncHandler(userController.getProfile));
router.get('/:uuid', validateUuidParam('uuid'), asyncHandler(userController.getUserController));

router.put('/:uuid', validateUuidParam('uuid'), asyncHandler(userController.updateUserController));

router.patch('/:uuid/deactivate', validateUuidParam('uuid'), asyncHandler(userController.deactivateUserController));
router.patch('/:uuid/reactivate', validateUuidParam('uuid'), asyncHandler(userController.reactivateUserController));

router.post('/logout', asyncHandler(userController.logout));

module.exports = router;