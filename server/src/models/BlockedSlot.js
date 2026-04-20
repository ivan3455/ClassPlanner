const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BlockedSlot = sequelize.define('BlockedSlot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: true, // Можна заблокувати конкретний день тижня назавжди
  },
  specificDate: {
    type: DataTypes.DATEONLY,
    allowNull: true, // Або конкретну дату (наприклад, 2026-08-24)
  },
  timeSlot: {
    type: DataTypes.STRING, 
    allowNull: true, // Якщо null — блокується весь день
  },
  reason: {
    type: DataTypes.STRING, // Причина: "Свято", "Технічні роботи"
    allowNull: true,
  }
});

module.exports = BlockedSlot;