const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Institution = sequelize.define('Institution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('University', 'School', 'College'),
    allowNull: false,
    defaultValue: 'University',
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true, // Nullable because schools do not have separate departments/faculties
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { 
      isEmail: true 
    }
  },
  deletionRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null // Used for the 48-hour delayed deletion window
  }
}, {
  timestamps: true,
});

module.exports = Institution;