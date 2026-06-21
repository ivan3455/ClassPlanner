const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    // Note: Global unique constraint removed to allow identical group names across different institutions.
  },
  studentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { 
      min: 1 
    },
  },
  course: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12, // Restricts course numbers to standard academic cycles (Schools/Bachelors/Masters)
    }
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Self-referencing key to handle subgroups or elective discipline streams dynamically
  parentGroupId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Groups',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: false,
  indexes: [
    // Multi-column unique index: ensures unique group names within the same institution
    {
      unique: true,
      fields: ['name', 'InstitutionId']
    }
  ]
});

module.exports = Group;