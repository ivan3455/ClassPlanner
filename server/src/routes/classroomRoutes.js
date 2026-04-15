const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Створення - тільки Адмін/Методист
router.post('/', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Methodist']), 
  classroomController.createClassroom
);

// Перегляд - всі авторизовані
router.get('/', authMiddleware, classroomController.getAllClassrooms);

module.exports = router;