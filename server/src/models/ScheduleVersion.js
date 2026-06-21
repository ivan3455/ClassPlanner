const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ScheduleVersion = sequelize.define('ScheduleVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  InstitutionId: { 
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Institutions',
      key: 'id',
    }
  },
  academicYear: { 
    type: DataTypes.STRING,
    allowNull: true, // Наприклад, "2025/2026"
  },
  daysPerWeek: { 
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: { 
      min: 1, 
      max: 7 
    }
  },
  weekendDays: { 
    type: DataTypes.STRING,
    defaultValue: "Sunday",
  },
  allowSubgroups: { 
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  allowElectiveSimultaneity: { 
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  allowWindows: { 
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
});

module.exports = ScheduleVersion;