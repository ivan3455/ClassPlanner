const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // 1. Перевірка, чи користувач вже існує
    const candidate = await User.findOne({ where: { email } });
    if (candidate) {
      return res.status(400).json({ message: 'Користувач з таким email вже існує' });
    }

    // 2. Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Створення користувача
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: 'Користувача створено успішно', userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при реєстрації', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Пошук користувача
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    // 2. Перевірка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Невірний пароль' });
    }

    // 3. Створення токена (дійсний 24 години)
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при вході', error: error.message });
  }
};