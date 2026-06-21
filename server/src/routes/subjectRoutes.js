const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Globally enforce authentication for all academic subject endpoints
router.use(authMiddleware);

// Subject configuration mutations (Restricted to Methodist only)
router.post('/', roleMiddleware(['Methodist']), subjectController.createSubject);
router.put('/:id', roleMiddleware(['Methodist']), subjectController.updateSubject);
router.delete('/:id', roleMiddleware(['Methodist']), subjectController.deleteSubject);

// Read-only endpoint (Accessible by both Methodist and Teachers for reference)
router.get('/', roleMiddleware(['Methodist', 'Teacher']), subjectController.getAllSubjects);

module.exports = router;