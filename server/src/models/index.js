const { sequelize } = require('../config/db');

const Institution = require('./Institution');
const User = require('./User');
const Teacher = require('./Teacher');
const Subject = require('./Subject');
const Classroom = require('./Classroom');
const Group = require('./Group');
const Schedule = require('./Schedule');
const ScheduleVersion = require('./ScheduleVersion');
const BlockedSlot = require('./BlockedSlot');
const TeacherConstraint = require('./TeacherConstraint');
const Curriculum = require('./Curriculum');
const TimeSettings = require('./TimeSettings');
const InstitutionRequest = require('./InstitutionRequest');
const TeacherRequest = require('./TeacherRequest');

// --- DATABASE ASSOCIATIONS ---

// Institution Associations
Institution.hasMany(User, { foreignKey: 'InstitutionId', onDelete: 'CASCADE' }); 
User.belongsTo(Institution, { foreignKey: 'InstitutionId' });

Institution.hasMany(Group, { foreignKey: 'InstitutionId', onDelete: 'CASCADE' });
Group.belongsTo(Institution, { foreignKey: 'InstitutionId' });

Institution.hasMany(Classroom, { foreignKey: 'InstitutionId', onDelete: 'CASCADE' });
Classroom.belongsTo(Institution, { foreignKey: 'InstitutionId' });

Institution.hasMany(ScheduleVersion, { foreignKey: 'InstitutionId', onDelete: 'CASCADE' });
ScheduleVersion.belongsTo(Institution, { foreignKey: 'InstitutionId' });

Institution.hasMany(Subject, { foreignKey: 'InstitutionId', onDelete: 'CASCADE' });
Subject.belongsTo(Institution, { foreignKey: 'InstitutionId' });

// User and Teacher Extension (One-to-One)
User.hasOne(Teacher, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Teacher.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(TeacherRequest, { foreignKey: 'teacherId', onDelete: 'CASCADE' });
TeacherRequest.belongsTo(User, { foreignKey: 'teacherId', as: 'Teacher' });

// Schedule Version Associations
ScheduleVersion.hasMany(Schedule, { onDelete: 'CASCADE' });
Schedule.belongsTo(ScheduleVersion);

ScheduleVersion.hasMany(TimeSettings, { onDelete: 'CASCADE' });
TimeSettings.belongsTo(ScheduleVersion);

ScheduleVersion.hasMany(BlockedSlot, { onDelete: 'CASCADE' });
BlockedSlot.belongsTo(ScheduleVersion);

// Schedule Entry Core Associations
Schedule.belongsTo(Group);
Group.hasMany(Schedule);

Schedule.belongsTo(Subject);
Subject.hasMany(Schedule);

Schedule.belongsTo(Classroom);
Classroom.hasMany(Schedule);

Schedule.belongsTo(User, { as: 'Teacher', foreignKey: 'TeacherId' });
User.hasMany(Schedule, { foreignKey: 'TeacherId' });

// Teacher Constraints
User.hasMany(TeacherConstraint, { foreignKey: 'TeacherId', onDelete: 'CASCADE' });
TeacherConstraint.belongsTo(User, { foreignKey: 'TeacherId', as: 'Teacher' });

// Curriculum (Study Plan) & Group Structure Associations
// 1. Self-referencing associations for subgroups (Fix for Step 5)
Group.hasMany(Group, { as: 'Subgroups', foreignKey: 'parentGroupId' });
Group.belongsTo(Group, { as: 'ParentGroup', foreignKey: 'parentGroupId' });

// 2. Core Curriculum connections (Fix for Step 6)
Group.hasMany(Curriculum, { foreignKey: 'GroupId', onDelete: 'CASCADE' });
Curriculum.belongsTo(Group, { foreignKey: 'GroupId' });

Subject.hasMany(Curriculum, { onDelete: 'CASCADE' });
Curriculum.belongsTo(Subject);

Curriculum.belongsTo(User, { as: 'RecommendedTeacher', foreignKey: 'TeacherId' });

module.exports = {
  sequelize,
  Institution,
  User,
  Teacher,
  Subject,
  Classroom,
  Group,
  Schedule,
  ScheduleVersion,
  BlockedSlot,
  TeacherConstraint,
  Curriculum,
  TimeSettings,
  InstitutionRequest,
  TeacherRequest
};