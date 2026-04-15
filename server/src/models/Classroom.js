const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Classroom = sequelize.define('Classroom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Наприклад, "409" або "Ауд. 12"
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  type: {
    type: DataTypes.ENUM('Lecture', 'Laboratory', 'Gym', 'Computer Class'),
    defaultValue: 'Lecture',
  },
  building: {
    type: DataTypes.STRING, // Корпус
    allowNull: true,
  }
});

module.exports = Classroom;