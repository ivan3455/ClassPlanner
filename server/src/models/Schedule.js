const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: false,
  },
  timeSlot: {
    type: DataTypes.STRING, // Наприклад, "08:30 - 10:00"
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('Lecture', 'Practice', 'Laboratory'),
    defaultValue: 'Lecture',
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

module.exports = Schedule;