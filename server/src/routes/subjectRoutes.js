const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Створювати дисципліни можуть тільки Адмін та Методист
router.post('/', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Methodist']), 
  subjectController.createSubject
);

// Переглядати можуть всі авторизовані користувачі
router.get('/', authMiddleware, subjectController.getAllSubjects);

module.exports = router;