/**
 * Restricts access to endpoints based on user roles
 * @param {String[]} roles - Array of authorized roles (e.g., ['SuperAdmin', 'Methodist'])
 */
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // Safety check if authMiddleware was not executed beforehand
    if (!req.user) {
      return res.status(401).json({ message: 'User unauthorized. Authentication metadata missing.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden. Insufficient permissions.' });
    }

    next();
  };
};

module.exports = roleMiddleware;