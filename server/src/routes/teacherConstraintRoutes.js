const express = require('express');
const router = express.Router();
const teacherConstraintController = require('../controllers/teacherConstraintController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Secure all teacher constraint operations under global authentication
router.use(authMiddleware);

// ФІКС ДОСТУПУ: Дозволяємо і методисту, і самому викладачу робити мутації (створювати/видаляти обмеження)
router.post('/', roleMiddleware(['Methodist', 'Teacher']), teacherConstraintController.setTeacherConstraints);

// Query endpoint (Accessible by Methodist to configure, and Teachers to review their schedule)
router.get('/', roleMiddleware(['Methodist', 'Teacher']), teacherConstraintController.getTeacherConstraints);

module.exports = router;