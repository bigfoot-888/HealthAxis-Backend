const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

const {requirePermission} = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

router.get('/', requirePermission("dashboard:read"), asyncHandler(dashboardController.getDashboardController));

router.patch('/layout', requirePermission("dashboard:read"), asyncHandler(dashboardController.updateLayoutController));

router.delete('/components/:id', requirePermission("dashboard:read"), asyncHandler(dashboardController.deleteComponentController));

router.post('/components', requirePermission("dashboard:read"), asyncHandler(dashboardController.createComponentController));

module.exports = router;