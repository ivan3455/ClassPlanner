const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Existing route for new institutions to request system registration
router.post('/request-institution', publicController.createInstitutionRequest);

// --- NEW PUBLIC ROUTING SEGMENTS FOR OPEN SCHEDULE VIEW ---
router.get('/groups', publicController.getPublicGroups);
router.get('/teachers', publicController.getPublicTeachers);
router.get('/classrooms', publicController.getPublicClassrooms);
router.get('/time-settings/:versionId', publicController.getPublicTimeSettings);
router.get('/view/:versionId', publicController.getPublicScheduleView);

module.exports = router;