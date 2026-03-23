const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard-controller');
const asyncHandler = require('../../middlewares/async-handler');

// Get full dashboard with all of its components
router.get('/', asyncHandler(dashboardController.getDashboardController));

// TODO IF NECESSARY Get only component data
router.get('/components', asyncHandler(dashboardController.getDashboardComponentsController));

// TODO IF NECESSARY Get single component 
router.get('/components/:id', asyncHandler(dashboardController.getDashboardComponentController));

module.exports = router;
