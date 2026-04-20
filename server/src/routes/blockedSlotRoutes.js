const express = require('express');
const router = express.Router();
const blockedSlotController = require('../controllers/blockedSlotController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['Admin']), blockedSlotController.blockSlot);

module.exports = router;