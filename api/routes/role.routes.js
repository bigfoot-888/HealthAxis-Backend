const express = require('express');
const router = express.Router();

const roleController = require('../controllers/role.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');

const requirePermission = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

router.get('/', requirePermission("user:read"), asyncHandler(roleController.getRolesPlainController));
router.get('/filtered', requirePermission("user:read"), asyncHandler(roleController.getFilteredRolesController));

module.exports = router;