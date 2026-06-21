const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Base authentication required for all curriculum actions
router.use(authMiddleware);

// Coordinator-only configuration endpoints
router.post('/', roleMiddleware(['Methodist']), curriculumController.createCurriculum);
router.put('/:id', roleMiddleware(['Methodist']), curriculumController.updateCurriculum);
router.delete('/:id', roleMiddleware(['Methodist']), curriculumController.deleteCurriculum);
router.get('/', roleMiddleware(['Methodist']), curriculumController.getAllCurriculums);

// Shared endpoints (Accessible by both Methodist and Teachers for reference)
router.get('/group/:groupId', roleMiddleware(['Methodist', 'Teacher']), curriculumController.getGroupCurriculum);

module.exports = router;