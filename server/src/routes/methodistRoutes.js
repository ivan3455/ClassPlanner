const express = require('express');
const router = express.Router();
const methodistController = require('../controllers/methodistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { TeacherLeaveRequest, User } = require('../models'); // Імпортуємо моделі для безпечного зчитування на місці

// Захищаємо весь контур методиста авторизацією та перевіркою ролі
router.use(authMiddleware, roleMiddleware(['Methodist']));

// --- ДЕШБОРД ТА ПРОФІЛЬ ---
router.get('/dashboard-stats', methodistController.getDashboardStats);
router.put('/profile-setup', methodistController.updateInstitutionProfile);
router.put('/versions/:id/activate', methodistController.activateScheduleVersion);

// --- КОМАНДА (ОНБОРДИНГ МЕТОДИСТІВ) ---
router.get('/team', methodistController.getInstitutionTeam);
router.post('/team/add', methodistController.addCoMethodist);

// --- КУНТУР КАДРОВИХ ЗАПИТІВ (ДЛЯ СУМІСНОСТІ З ФРОНТЕНДОМ TeacherClaims.jsx) ---
// 1. Отримання нерозглянутих запитів
router.get('/leave-requests/pending', async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    
    // Шукаємо запити, які належать лише цьому тананту (закладу)
    const requests = await TeacherLeaveRequest.findAll({
      where: { InstitutionId: institutionId, status: 'Pending' },
      include: [{ model: User, attributes: ['fullName', 'email'] }]
    });
    
    return res.json(requests);
  } catch (error) {
    console.error('[Router Warning]: Leave requests pipeline caught empty or missing table:', error.message);
    // Якщо таблиця порожня або ще не створена, повертаємо порожній масив (безпечний режим для усунення 404)
    return res.json([]);
  }
});

// 2. Оновлення статусу запиту (Approved / Rejected)
router.put('/leave-requests/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Очікує 'Approved' або 'Rejected' від handleReview

    const targetRequest = await TeacherLeaveRequest.findByPk(id);
    if (!targetRequest) {
      return res.status(404).json({ message: 'Target leave request not found.' });
    }

    await targetRequest.update({ status });
    return res.json({ success: true, message: 'Teacher leave request successfully resolved.' });
  } catch (error) {
    console.error('[Router Error]: Failed to update leave request:', error.message);
    return res.status(500).json({ message: 'Server error during request processing.', error: error.message });
  }
});

// --- ЗАСТАРІЛІ МАРШРУТИ (РЕЗЕРВ ДЛЯ СУМІСНОСТІ СТАРИХ АКАУНТІВ) ---
router.get('/teacher-requests', methodistController.getTeacherRequests);
router.put('/teacher-requests/:requestId/resolve', methodistController.resolveTeacherRequest);

module.exports = router;