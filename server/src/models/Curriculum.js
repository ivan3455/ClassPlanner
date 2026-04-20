const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Curriculum = sequelize.define('Curriculum', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  hoursPerSemester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  lectureHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  practiceHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  labHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Curriculum;