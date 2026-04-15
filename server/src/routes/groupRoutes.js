const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Methodist']), 
  groupController.createGroup
);

router.get('/', authMiddleware, groupController.getAllGroups);

module.exports = router;