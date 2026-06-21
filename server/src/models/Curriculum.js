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
  GroupId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Groups',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  SubjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Subjects',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  TeacherId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  // Навчальні плани прив'язуються суворо до ітераційної версії
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
  tableName: 'Curriculums',
  validate: {
    semesterHoursSumCheck() {
      const breakdownSum = (this.lectureHours || 0) + (this.practiceHours || 0) + (this.labHours || 0);
      if (this.hoursPerSemester < breakdownSum) {
        throw new Error('hoursPerSemester cannot be less than the sum of lecture, practice, and laboratory hours');
      }
    }
  }
});

module.exports = Curriculum;