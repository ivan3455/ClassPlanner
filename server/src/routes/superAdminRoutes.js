const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Apply security middlewares globally to all superadmin endpoints
router.use(authMiddleware, roleMiddleware(['SuperAdmin']));

// Institution and Methodist onboarding (Approval processing)
router.post('/setup-institution', superAdminController.createInstitutionWithMethodist);

// Management of Institutions
router.get('/institutions', superAdminController.getAllInstitutions);
router.put('/institutions/:instId', superAdminController.updateInstitutionData);
router.delete('/institutions/:id', superAdminController.deleteInstitution);
router.post('/institutions/:id/restore', superAdminController.restoreInstitution);

// Management of Methodists
router.post('/institutions/:instId/methodists', superAdminController.addMethodistToInstitution);
router.put('/methodists/:methodistId', superAdminController.updateMethodistUser);
router.delete('/methodists/:methodistId', superAdminController.deleteMethodist);

// Requests monitoring & evaluation
router.get('/requests', superAdminController.getRequests);
router.put('/requests/:requestId/reject', superAdminController.rejectRequest); // New explicit endpoint for rejection

module.exports = router;