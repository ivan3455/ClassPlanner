const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route for authentication
router.post('/login', authController.login);

// Protected profile route to verify current token status and retrieve session metadata
router.get('/me', authMiddleware, (req, res) => {
  res.json({ message: 'Authentication successful', user: req.user });
});

router.put('/change-password', authMiddleware, authController.changePassword);

// ТИМЧАСОВИЙ ДЕБАГ-РОУТ ДЛЯ ГЕНЕРАЦІЇ ТОКЕНА ТА ПЕРЕВІРКИ ХЕШУ
router.get('/debug-fix-ivan', async (req, res) => {
  try {
    const { User } = require('../models');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    // 1. Генеруємо хеш пароля password123 безпосередньо через твій bcryptjs
    const salt = await bcrypt.genSalt(10);
    const guaranteedHash = await bcrypt.hash('password123', salt);

    // 2. Знаходимо твій тестовий акаунт в БД
    const email = 'ivan.tester@edu.ua';
    let user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ 
        message: `User with email ${email} not found in DB. Check if seed script executed successfully.` 
      });
    }

    // 3. Перезаписуємо йому пароль на щойно згенерований і сумісний
    user.password = guaranteedHash;
    await user.save();

    // 4. Одразу генеруємо для тебе робочий JWT-токен, щоб ти не втрачав час на логін
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        InstitutionId: user.InstitutionId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      message: "Password successfully synchronized inside your runtime!",
      generatedHash: guaranteedHash,
      email: user.email,
      token: token, // <--- ЦЕЙ ТОКЕН МОЖНА ОДРАЗУ БРАТИ В POSTMAN!
      testBodyForLogin: {
        email: user.email,
        password: "password123"
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;