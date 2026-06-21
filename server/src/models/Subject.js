const { DataTypes, Op } = require('sequelize');
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
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  shortName: { 
    type: DataTypes.STRING,
    allowNull: true,
  },
  totalHours: { 
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  lectureHours: { 
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  practiceHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  labHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  // Предмети також диференціюються залежно від поточної версії/семестру розкладу
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
      fields: ['code', 'ScheduleVersionId'],
      where: {
        code: { [Op.ne]: null }
      }
    }
  ],
  validate: {
    hoursSumCheck() {
      const breakdownSum = (this.lectureHours || 0) + (this.practiceHours || 0) + (this.labHours || 0);
      if (this.totalHours < breakdownSum) {
        throw new Error('totalHours cannot be less than the sum of lecture, practice, and laboratory hours');
      }
    }
  }
});

module.exports = Subject;