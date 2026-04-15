const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['Admin', 'Methodist']), versionController.createVersion);
router.patch('/:id/activate', authMiddleware, roleMiddleware(['Admin', 'Methodist']), versionController.activateVersion);
router.post('/:id/duplicate', authMiddleware, roleMiddleware(['Admin', 'Methodist']), versionController.duplicateVersion);

module.exports = router;