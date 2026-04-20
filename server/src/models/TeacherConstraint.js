const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeacherConstraint = sequelize.define('TeacherConstraint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME, // Наприклад, "08:30"
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME, // Наприклад, "18:00"
    allowNull: false,
  }
});

module.exports = TeacherConstraint;