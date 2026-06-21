const { User, Institution } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.scope('withPassword').findOne({ 
  where: { email },
  include: [{ model: Institution, attributes: ['type', 'name'] }]
});
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'User account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // SESSION LIFECYCLE STRATEGY:
    // 30 days expiry if "Remember Me" is checked, otherwise 2 hours
    const tokenExpiry = rememberMe ? '30d' : '2h';

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        InstitutionId: user.InstitutionId 
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        InstitutionId: user.InstitutionId,
        Institution: user.Institution
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Retreived directly from authMiddleware token payload

    // Fetch user with password scope to verify old credentials
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    // Hash the new password before storing
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error.message);
    res.status(500).json({ message: 'Server error during password update' });
  }
};