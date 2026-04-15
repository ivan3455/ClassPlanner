const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Отримуємо токен із заголовка Authorization (формат "Bearer TOKEN")
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Користувач не авторизований (відсутній токен)' });
  }

  const token = authHeader.split(' ')[1]; // Беремо частину після "Bearer"

  try {
    // 2. Декодуємо токен за допомогою нашого секретного ключа
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Додаємо дані користувача в об'єкт запиту (req.user), щоб контролери могли їх бачити
    req.user = decoded;
    
    // 4. Передаємо керування наступній функції
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Недійсний токен' });
  }
};