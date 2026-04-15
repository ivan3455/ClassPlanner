const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    unique: true, // Наприклад, "CS101"
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

module.exports = Subject;