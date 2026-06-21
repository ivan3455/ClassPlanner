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
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  type: {
    type: DataTypes.ENUM('Lecture', 'Laboratory', 'Gym', 'Computer Class', 'General'),
    defaultValue: 'General',
  },
  building: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shortName: { 
    type: DataTypes.STRING,
    allowNull: true,
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Архітектурний зв'язок з конкретною ізольованою версією розкладу
  ScheduleVersionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ScheduleVersions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['number', 'ScheduleVersionId']
    }
  ]
});

module.exports = Classroom;