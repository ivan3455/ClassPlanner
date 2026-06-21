const { 
  InstitutionRequest,
  Group, 
  User, 
  Classroom, 
  TimeSettings, 
  Schedule, 
  ScheduleVersion, 
  Subject 
} = require('../models');

// Внутрішній ізольований хелпер для безпечного отримання InstitutionId через версію розкладу
const getInstitutionIdByVersion = async (versionId) => {
  if (!versionId) return null;
  const version = await ScheduleVersion.findByPk(versionId);
  return version ? version.InstitutionId : null;
};

// Submits a public registration request including dynamic institution classification type
exports.createInstitutionRequest = async (req, res) => {
  try {
    const { instName, instType, methodistName, methodistEmail, comment } = req.body;

    // Core schema parameter presence evaluation
    if (!instName || !instType || !methodistName || !methodistEmail) {
      return res.status(400).json({ 
        message: 'Missing required fields: institution name, type, coordinator name, and email are mandatory.' 
      });
    }

    // Explicit structural safety validation against supported database ENUM entries
    const allowedTypes = ['University', 'School', 'College'];
    if (!allowedTypes.includes(instType)) {
      return res.status(400).json({ 
        message: 'Validation failed: Invalid academic institution type specification.' 
      });
    }

    const newRequest = await InstitutionRequest.create({
      instName: instName.trim(),
      instType, // Maps straight into the configuration profile state
      methodistName: methodistName.trim(),
      methodistEmail: methodistEmail.trim().toLowerCase(),
      comment: comment ? comment.trim() : null
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Public Institution Request Error:', error.message);
    res.status(500).json({ message: 'Server error while processing registration request.' });
  }
};

// Retrieves active academic groups bound to the target version's multi-tenant tier
exports.getPublicGroups = async (req, res) => {
  try {
    const { versionId } = req.query;
    const institutionId = await getInstitutionIdByVersion(versionId);
    if (!institutionId) {
      return res.status(400).json({ message: 'Invalid or missing versionId parameter context.' });
    }

    const groups = await Group.findAll({ 
      where: { InstitutionId: institutionId, parentGroupId: null }, // Тільки батьківські потоки для первинного фільтру
      order: [['name', 'ASC']]
    });
    res.json(groups);
  } catch (error) {
    console.error('Public Groups Fetch Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching public groups.', error: error.message });
  }
};

// Retrieves active faculty teachers bound to the target version's multi-tenant tier
exports.getPublicTeachers = async (req, res) => {
  try {
    const { versionId } = req.query;
    const institutionId = await getInstitutionIdByVersion(versionId);
    if (!institutionId) {
      return res.status(400).json({ message: 'Invalid or missing versionId parameter context.' });
    }

    const teachers = await User.findAll({
      where: { InstitutionId: institutionId, role: 'Teacher', isActive: true },
      attributes: ['id', 'fullName'],
      order: [['fullName', 'ASC']]
    });
    res.json(teachers);
  } catch (error) {
    console.error('Public Teachers Fetch Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching public teachers.', error: error.message });
  }
};

// Retrieves allocation-ready classrooms bound to the target version's multi-tenant tier
exports.getPublicClassrooms = async (req, res) => {
  try {
    const { versionId } = req.query;
    const institutionId = await getInstitutionIdByVersion(versionId);
    if (!institutionId) {
      return res.status(400).json({ message: 'Invalid or missing versionId parameter context.' });
    }

    const classrooms = await Classroom.findAll({
      where: { InstitutionId: institutionId, ScheduleVersionId: versionId, isAvailable: true },
      order: [['number', 'ASC']]
    });
    res.json(classrooms);
  } catch (error) {
    console.error('Public Classrooms Fetch Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching public classrooms.', error: error.message });
  }
};

// Retrieves configuration bell slots for chronological matrix mapping
exports.getPublicTimeSettings = async (req, res) => {
  try {
    const { versionId } = req.params;
    const timeSettings = await TimeSettings.findAll({
      where: { ScheduleVersionId: versionId },
      order: [['orderNumber', 'ASC']]
    });
    res.json(timeSettings);
  } catch (error) {
    console.error('Public Time Settings Fetch Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching public time slots.', error: error.message });
  }
};

// Resolves multi-channel reactive filter matrix queries for the open interface canvas
exports.getPublicScheduleView = async (req, res) => {
  try {
    const { versionId } = req.params;
    const { groupId, teacherId, classroomId } = req.query;

    if (!versionId) {
      return res.status(400).json({ message: 'Target version context identifier is required.' });
    }

    const whereClause = { ScheduleVersionId: versionId };

    // Звужуємо пошук, якщо гостем було обрано певний селектор фільтрації
    if (groupId) whereClause.GroupId = groupId;
    if (teacherId) whereClause.TeacherId = teacherId;
    if (classroomId) whereClause.ClassroomId = classroomId;

    const scheduleEntries = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Group, attributes: ['name', 'parentGroupId'] },
        { model: Subject, attributes: ['name', 'code'] },
        { model: Classroom, attributes: ['number', 'type'] },
        { model: User, as: 'Teacher', attributes: ['fullName'] }
      ]
    });

    res.json(scheduleEntries);
  } catch (error) {
    console.error('Public Schedule Matrix Grid Error:', error.message);
    res.status(500).json({ message: 'Server error while compiling public schedule matrix graph.', error: error.message });
  }
};