const Schedule = require('../models/Schedule');
const { Op } = require('sequelize');

exports.checkConflicts = async (data) => {
  const { dayOfWeek, timeSlot, ClassroomId, TeacherId, GroupId } = data;

  // Шукаємо будь-який запис, який збігається за часом і днем
  const conflict = await Schedule.findOne({
    where: {
      dayOfWeek,
      timeSlot,
      [Op.or]: [
        { ClassroomId }, // Та сама аудиторія
        { TeacherId },   // Той самий викладач
        { GroupId }      // Та сама група
      ]
    }
  });

  if (conflict) {
    if (conflict.ClassroomId === ClassroomId) return "Ця аудиторія вже зайнята в даний час.";
    if (conflict.TeacherId === TeacherId) return "Викладач вже має заняття в даний час.";
    if (conflict.GroupId === GroupId) return "У цієї групи вже є заняття в даний час.";
  }

  return null; // Конфліктів не знайдено
};