const TeacherConstraint = require('../models/TeacherConstraint');

exports.setConstraint = async (req, res) => {
  try {
    const constraint = await TeacherConstraint.create(req.body);
    res.status(201).json(constraint);
  } catch (error) {
    res.status(500).json({ message: 'Помилка створення графіка', error: error.message });
  }
};