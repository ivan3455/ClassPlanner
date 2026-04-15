const Schedule = require('../models/Schedule');
const Group = require('../models/Group');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

const scheduleService = require('../services/scheduleService'); // Імпортуємо сервіс

exports.createScheduleEntry = async (req, res) => {
  try {
    const { dayOfWeek, timeSlot, ClassroomId, TeacherId, GroupId } = req.body;

    // 1. Перевірка на конфлікти
    const conflictMessage = await scheduleService.checkConflicts(req.body);
    if (conflictMessage) {
      return res.status(409).json({ message: conflictMessage });
    }

    // 2. Якщо конфліктів немає — створюємо запис
    const entry = await Schedule.create(req.body);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при створенні запису', error: error.message });
  }
};

exports.getFullSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findAll({
      include: [Group, Subject, Classroom, { model: User, as: 'Teacher', attributes: ['fullName', 'email'] }]
    });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при отриманні розкладу', error: error.message });
  }
};

exports.replaceTeacher = async (req, res) => {
  try {
    const { id } = req.params; // ID запису в розкладі
    const { TeacherId } = req.body; // ID нового викладача

    // 1. Знаходимо запис розкладу
    const entry = await Schedule.findByPk(id);
    if (!entry) {
      return res.status(404).json({ message: 'Запис розкладу не знайдено' });
    }

    // 2. Перевіряємо, чи не зайнятий новий викладач у цей час
    const conflict = await Schedule.findOne({
      where: {
        dayOfWeek: entry.dayOfWeek,
        timeSlot: entry.timeSlot,
        TeacherId: TeacherId
      }
    });

    if (conflict) {
      return res.status(409).json({ message: 'Новий викладач уже має заняття в цей час' });
    }

    // 3. Оновлюємо викладача
    entry.TeacherId = TeacherId;
    await entry.save();

    res.json({ message: 'Викладача успішно замінено', entry });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при заміні викладача', error: error.message });
  }
};

exports.updateScheduleEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Schedule.findByPk(id);

    if (!entry) {
      return res.status(404).json({ message: 'Запис розкладу не знайдено' });
    }

    // Оновлюємо запис даними з тіла запиту
    await entry.update(req.body);

    res.json({ message: 'Запис успішно оновлено', entry });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при оновленні запису', error: error.message });
  }
};