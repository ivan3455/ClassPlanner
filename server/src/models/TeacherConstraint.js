const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeacherConstraint = sequelize.define('TeacherConstraint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING, // Changed to STRING for consistency with TimeSettings
    allowNull: false,
  },
  endTime: {
    type: DataTypes.STRING, // Changed to STRING for sophistication of schedule calculations
    allowNull: false,
  }
}, {
  timestamps: false,
  // Model-wide validation to ensure chronological integrity
  validate: {
    chronologicalOrder() {
      // Direct string comparison works perfectly for standard HH:MM formats
      if (this.startTime >= this.endTime) {
        throw new Error('endTime must be strictly after startTime');
      }
    }
  }
});

module.exports = TeacherConstraint;