const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeacherRequest = sequelize.define('TeacherRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  requestType: {
    type: DataTypes.ENUM('DayOff', 'Substitution', 'Reschedule'),
    allowNull: false, // DayOff = відгул, Substitution = заміна, Reschedule = перенос
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  details: {
    type: DataTypes.JSON,
    allowNull: false,
    /* 
      Flexible JSON field to store request specifics:
      - For 'DayOff': { "date": "2026-05-20", "reason": "Medical checkup" }
      - For 'Reschedule': { "scheduleId": "UUID", "desiredDay": "Wednesday", "desiredSlot": "2" }
      - For 'Substitution': { "scheduleId": "UUID", "substituteTeacherId": "UUID" }
    */
  },
  commentFromMethodist: {
    type: DataTypes.STRING,
    allowNull: true, // Resolution note if rejected or modified
  }
}, {
  timestamps: true,
});

module.exports = TeacherRequest;