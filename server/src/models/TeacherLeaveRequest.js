const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeacherLeaveRequest = sequelize.define('TeacherLeaveRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('SickLeave', 'DayOff', 'Vacation'), // Лікарняний, Вихідний, Відпустка
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY, // Формат YYYY-MM-DD
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  InstitutionId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  timestamps: true,
});

module.exports = TeacherLeaveRequest;