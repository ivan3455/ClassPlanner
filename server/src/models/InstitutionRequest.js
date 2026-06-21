const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InstitutionRequest = sequelize.define('InstitutionRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  instName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  instType: {
    type: DataTypes.ENUM('University', 'School', 'College'),
    allowNull: false,
    defaultValue: 'University',
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true, // Specifying a faculty/department is optional or non-applicable for schools
  },
  methodistName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  methodistEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  }
}, {
  timestamps: true,
});

module.exports = InstitutionRequest;