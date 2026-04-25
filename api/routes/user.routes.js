const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const {createUserRules, updateUserRules} = require('../validators/user.validators');
const validateRequest = require('../../middlewares/request-validator.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

const {requirePermission} = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

router.post('/', requirePermission("user:create"), createUserRules, validateRequest, asyncHandler(userController.createUserController));
router.post('/import', requirePermission("user:create"), asyncHandler(userController.importUsersController));

router.get('/', requirePermission("user:read"), asyncHandler(userController.getUsersController));
router.get('/filtered',requirePermission("user:read"), asyncHandler(userController.getFilteredUsersController));
router.get('/profile', requirePermission("user:read"), asyncHandler(userController.getProfile));
router.get('/:uuid', requirePermission("user:read"), validateUuidParam('uuid'), asyncHandler(userController.getUserController));

router.put('/:uuid', requirePermission("user:update"), updateUserRules, validateRequest, validateUuidParam('uuid'), asyncHandler(userController.updateUserController));

router.patch('/:uuid/deactivate', requirePermission("user:delete"), validateUuidParam('uuid'), asyncHandler(userController.deactivateUserController));
router.patch('/:uuid/reactivate', requirePermission("user:update"), validateUuidParam('uuid'), asyncHandler(userController.reactivateUserController));

module.exports = router;