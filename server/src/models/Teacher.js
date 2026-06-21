const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Teacher = sequelize.define('Teacher', {
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  UserId: {
    type: DataTypes.UUID,
    unique: true,
    allowNull: false
  },
  department: { 
    type: DataTypes.STRING,
    allowNull: true // Represents a university department (кафедра) or school subject committee
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {} // Flexible field for non-time-slot algorithmic configurations
  }
}, {
  timestamps: false,
});

module.exports = Teacher;