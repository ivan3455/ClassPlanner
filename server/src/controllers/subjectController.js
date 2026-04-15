const Subject = require('../models/Subject');

// Створення дисципліни
exports.createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const newSubject = await Subject.create({ name, code, description });
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при створенні дисципліни', error: error.message });
  }
};

// Отримання всіх дисциплін
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при отриманні списку', error: error.message });
  }
};