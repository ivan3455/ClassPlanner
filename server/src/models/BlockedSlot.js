const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BlockedSlot = sequelize.define('BlockedSlot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: true, // If provided, locks this specific day of the week cyclically
  },
  specificDate: {
    type: DataTypes.DATEONLY,
    allowNull: true, // If provided, locks a specific calendar date (e.g., national holidays)
  },
  timeSlot: {
    type: DataTypes.STRING, 
    allowNull: true, // If null, the entire day is considered blocked
  },
  reason: {
    type: DataTypes.STRING, // e.g., "National Holiday", "Methodist Maintenance", "Sanitary Day"
    allowNull: true,
  }
}, {
  timestamps: true,
  // Model-wide validations to protect data integrity
  validate: {
    exclusivityCheck() {
      if (!this.dayOfWeek && !this.specificDate) {
        throw new Error('Either dayOfWeek or specificDate must be provided.');
      }
      if (this.dayOfWeek && this.specificDate) {
        throw new Error('Cannot provide both dayOfWeek and specificDate. Choose one.');
      }
    }
  }
});

module.exports = BlockedSlot;