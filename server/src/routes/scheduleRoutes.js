const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Methodist']), 
  scheduleController.createScheduleEntry
);

router.get('/', authMiddleware, scheduleController.getFullSchedule);

router.patch('/:id/replace-teacher', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Methodist']), 
  scheduleController.replaceTeacher
);

router.patch('/:id', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Methodist']), 
  scheduleController.updateScheduleEntry
);

module.exports = router;