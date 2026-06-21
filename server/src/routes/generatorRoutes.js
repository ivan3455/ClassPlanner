const express = require('express');
const router = express.Router();
const generatorController = require('../controllers/generatorController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Secure all scheduling engine endpoints to institutional Methodists only
router.use(authMiddleware, roleMiddleware(['Methodist']));

// Readiness check and execution endpoints
router.get('/check-readiness/:versionId', generatorController.checkReadiness);
router.post('/run/:versionId', generatorController.runGenerator);

module.exports = router;