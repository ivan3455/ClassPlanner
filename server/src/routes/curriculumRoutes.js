const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Створити запис у плані
router.post('/', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Methodist']), 
  curriculumController.createCurriculum
);

// Отримати всі плани
router.get('/', authMiddleware, curriculumController.getAllCurriculums);

// Отримати план конкретної групи
router.get('/group/:groupId', authMiddleware, curriculumController.getGroupCurriculum);

module.exports = router;