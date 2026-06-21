const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Globally protect all student group metadata endpoints for coordinators
router.use(authMiddleware, roleMiddleware(['Methodist']));

// Academic Group CRUD endpoints
router.get('/', groupController.getAllGroups);
router.post('/', groupController.createGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

module.exports = router;