const express = require('express');
const router = express.Router();
const timeSettingsController = require('../controllers/timeSettingsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Globally apply authentication and authorization constraints to the timeline configurations
router.use(authMiddleware, roleMiddleware(['Methodist']));

// Bell schedule (Time settings) configuration endpoints
router.get('/:versionId', timeSettingsController.getTimeSettings);
router.post('/bulk', timeSettingsController.setTimeSettings);

module.exports = router;