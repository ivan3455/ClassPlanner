const Classroom = require('../models/Classroom');

// Створення аудиторії
exports.createClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при створенні аудиторії', error: error.message });
  }
};

// Отримання всіх аудиторій
exports.getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.findAll();
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при отриманні списку', error: error.message });
  }
};