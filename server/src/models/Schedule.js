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
    type: DataTypes.STRING, 
    allowNull: false, // Matches orderNumber or time sequence from TimeSettings
  },
  type: {
    type: DataTypes.ENUM('Lecture', 'Practice', 'Laboratory'),
    defaultValue: 'Lecture',
  },
  weekType: {
    type: DataTypes.ENUM('EveryWeek', 'EvenWeek', 'OddWeek'),
    defaultValue: 'EveryWeek',
    allowNull: false,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
});

module.exports = Schedule;