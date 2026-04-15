module.exports = function (roles) {
  return function (req, res, next) {
    // req.user вже з'явився завдяки authMiddleware
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'У вас немає прав для виконання цієї операції' });
    }
    next();
  };
};