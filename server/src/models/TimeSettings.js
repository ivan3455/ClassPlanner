const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TimeSettings = sequelize.define('TimeSettings', {
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  orderNumber: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: { min: 1 }
  },
  startTime: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  endTime: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  // Конфігурація дзвінків тепер унікальна для кожного експерименту розкладу
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
      fields: ['orderNumber', 'ScheduleVersionId']
    }
  ],
  validate: {
    chronologicalOrder() {
      if (this.startTime >= this.endTime) {
        throw new Error('endTime must be strictly after startTime');
      }
    }
  }
});

module.exports = TimeSettings;