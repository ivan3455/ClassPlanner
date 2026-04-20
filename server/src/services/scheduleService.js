const Schedule = require('../models/Schedule');
const BlockedSlot = require('../models/BlockedSlot');
const TeacherConstraint = require('../models/TeacherConstraint');
const { Op } = require('sequelize');

exports.checkConflicts = async (data) => {
  const { dayOfWeek, timeSlot, ClassroomId, TeacherId, GroupId } = data;

  // 1. ПЕРЕВІРКА ГЛОБАЛЬНИХ БЛОКУВАНЬ (Свята / Вихідні)
  const isBlocked = await BlockedSlot.findOne({
    where: {
      [Op.or]: [
        { dayOfWeek, timeSlot: null }, // Заблоковано весь день
        { dayOfWeek, timeSlot },       // Заблоковано конкретний слот
      ]
    }
  });

  if (isBlocked) {
    return `Цей час заблоковано: ${isBlocked.reason || 'Технічна перерва'}`;
  }

  // 2. ПЕРЕВІРКА ГРАФІКА ВИКЛАДАЧА (Суворий режим)
  // Шукаємо ВСІ обмеження цього викладача
  const allTeacherConstraints = await TeacherConstraint.findAll({ 
    where: { TeacherId } 
  });

  // Якщо у викладача внесено хоча б одне обмеження, він може працювати ТІЛЬКИ там, де дозволено
  if (allTeacherConstraints.length > 0) {
    // Шукаємо дозволені вікна саме на цей день тижня
    const dayConstraints = allTeacherConstraints.filter(c => c.dayOfWeek === dayOfWeek);

    // Якщо на цей день немає жодного запису — викладач вихідний
    if (dayConstraints.length === 0) {
      return "Викладач не працює у цей день тижня.";
    }

    const lessonStart = timeSlot.split(' - ')[0]; // Витягуємо "08:30" з "08:30 - 10:00"
    
    // Перевіряємо, чи входить час початку пари в будь-яке з дозволених вікон
    const isAvailable = dayConstraints.some(c => {
      // Порівняння рядків часу (напр. "08:30" >= "08:00" && "08:30" < "13:00")
      return lessonStart >= c.startTime && lessonStart < c.endTime;
    });

    if (!isAvailable) {
      return "Викладач не працює в цей час згідно з графіком.";
    }
  }

  // 3. ПЕРЕВІРКА ФІЗИЧНИХ КОНФЛІКТІВ (Чи не зайняті об'єкти іншими парами)
  const conflict = await Schedule.findOne({
    where: {
      dayOfWeek,
      timeSlot,
      [Op.or]: [
        { ClassroomId },
        { TeacherId },
        { GroupId }
      ]
    }
  });

  if (conflict) {
    if (conflict.ClassroomId === ClassroomId) return "Ця аудиторія вже зайнята.";
    if (conflict.TeacherId === TeacherId) return "Викладач зайнятий.";
    if (conflict.GroupId === GroupId) return "У групи вже є пара.";
  }

  return null;
};