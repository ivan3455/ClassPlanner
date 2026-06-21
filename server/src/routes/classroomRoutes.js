const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Globally secure classroom routes for school/university coordinators
router.use(authMiddleware, roleMiddleware(['Methodist']));

// Classroom CRUD endpoints
router.get('/', classroomController.getAllClassrooms);
router.post('/', classroomController.createClassroom);
router.put('/:id', classroomController.updateClassroom);
router.delete('/:id', classroomController.deleteClassroom);

module.exports = router;