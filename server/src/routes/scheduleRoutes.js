const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Enforce authentication for all schedule operations
router.use(authMiddleware);

// Read-only endpoints (Accessible by both Methodist and Teachers)
router.get('/view/:versionId', roleMiddleware(['Methodist', 'Teacher']), scheduleController.getScheduleView);

// Mutation and configuration endpoints (Restricted to Methodist only)
router.post('/', roleMiddleware(['Methodist']), scheduleController.createScheduleEntry);
router.put('/:id', roleMiddleware(['Methodist']), scheduleController.updateScheduleEntry);
router.put('/:id/replace-teacher', roleMiddleware(['Methodist']), scheduleController.replaceTeacher);
router.delete('/clear/:versionId', roleMiddleware(['Methodist']), scheduleController.clearVersionSchedule);

router.get('/export/excel', roleMiddleware(['Methodist']), scheduleController.downloadExcel);

module.exports = router;