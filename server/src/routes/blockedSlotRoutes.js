const express = require('express');
const router = express.Router();
const blockedSlotController = require('../controllers/blockedSlotController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Apply auth and role protection globally to all blocked-slot configuration routes
router.use(authMiddleware, roleMiddleware(['Methodist']));

// Retrieve blocked slots for a specific schedule version
router.get('/:versionId', blockedSlotController.getBlockedSlotsByVersion);

// Overwrite and save an array of blocked slots for a specific version
router.post('/', blockedSlotController.setBlockedSlots);

module.exports = router;