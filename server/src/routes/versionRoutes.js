const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Globally secure all schedule version endpoints under base authentication
router.use(authMiddleware);

// Version configuration queries (Accessible by Methodist and Teachers)
router.get('/', roleMiddleware(['Methodist', 'Teacher']), versionController.getVersions); 

// Version lifecycle mutations (Restricted to Methodist only)
router.post('/', roleMiddleware(['Methodist']), versionController.createVersion);
router.patch('/:id/activate', roleMiddleware(['Methodist']), versionController.activateVersion);
router.post('/:id/duplicate', roleMiddleware(['Methodist']), versionController.duplicateVersion);

module.exports = router;