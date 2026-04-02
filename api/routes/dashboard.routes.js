const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

router.get('/', asyncHandler(dashboardController.getDashboardController));

module.exports = router;