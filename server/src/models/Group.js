const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Наприклад, "Група 409"
  },
  studentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  course: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true, // Наприклад, "Інженерія програмного забезпечення"
  }
});

module.exports = Group;