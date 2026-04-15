const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ScheduleVersion = sequelize.define('ScheduleVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Наприклад, "Семестр 1 - Чернетка"
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Тільки одна версія може бути активною (публічною)
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

module.exports = ScheduleVersion;