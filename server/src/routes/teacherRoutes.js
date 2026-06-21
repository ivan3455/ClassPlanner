const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Усі операції з кадрами потребують авторизації токена JWT
router.use(authMiddleware);

// Ендпоінти адміністрування штату (Доступні виключно для ролі Methodist)
router.get('/', roleMiddleware(['Methodist']), teacherController.getAllTeachers);
router.post('/register', roleMiddleware(['Methodist']), teacherController.registerTeacher);
router.put('/:id', roleMiddleware(['Methodist']), teacherController.updateTeacher); 
router.delete('/:id', roleMiddleware(['Methodist']), teacherController.deleteTeacher); 

// Самостійні ендпоінти для викладачів (Доступні виключно для ролі Teacher)
const teacherLeaveController = require('../controllers/teacherLeaveController');
router.post('/leave-requests', roleMiddleware(['Teacher']), teacherLeaveController.createRequest);
router.get('/leave-requests/my', roleMiddleware(['Teacher']), teacherLeaveController.getMyRequests);

module.exports = router;