const express = require('express');
const router = express.Router();
const teacherConstraintController = require('../controllers/teacherConstraintController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Має бути '/' (бо префікс /api/teacher-constraints ми даємо в index.js)
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Methodist']), teacherConstraintController.setConstraint);

module.exports = router;