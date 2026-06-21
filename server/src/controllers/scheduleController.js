const { Schedule, Group, Subject, Classroom, User, ScheduleVersion } = require('../models');
const scheduleService = require('../services/scheduleService');
const exportService = require('../services/exportService');

// Retrieves schedule grid with dynamic optional query filters (groupId, teacherId, classroomId)
exports.getScheduleView = async (req, res) => {
  try {
    const { versionId } = req.params;
    const { groupId, teacherId, classroomId } = req.query;
    
    const institutionId = req.user.InstitutionId;

    // SECURITY VERIFICATION: Verify that the target version actually belongs to this institution before fetching entries
    const versionVerification = await ScheduleVersion.findOne({
      where: { id: versionId, InstitutionId: institutionId }
    });
    if (!versionVerification) {
      return res.status(403).json({ message: 'Access denied. The requested schedule version does not belong to your institution.' });
    }

    const whereClause = { ScheduleVersionId: versionId };

    // Apply granular filters dynamically if provided by the client
    if (groupId) whereClause.GroupId = groupId;
    if (teacherId) whereClause.TeacherId = teacherId;
    if (classroomId) whereClause.ClassroomId = classroomId;

    const scheduleData = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Group, attributes: ['id', 'name', 'parentGroupId'] },
        { model: User, as: 'Teacher', attributes: ['id', 'fullName', 'email'] },
        { model: Classroom, attributes: ['id', 'number', 'type', 'building'] },
        { model: Subject, attributes: ['id', 'name', 'code'] }
      ],
      order: [['dayOfWeek', 'ASC'], ['timeSlot', 'ASC']]
    });

    res.json(scheduleData);
  } catch (error) {
    console.error('Fetch Schedule View Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching schedule grid.' });
  }
};

// Manually creates a standalone schedule entry after checking for time conflicts
exports.createScheduleEntry = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    const { ScheduleVersionId } = req.body;

    const version = await ScheduleVersion.findOne({
      where: { id: ScheduleVersionId, InstitutionId: institutionId }
    });

    if (!version) {
      return res.status(403).json({ message: 'Access denied. Invalid schedule version instance.' });
    }

    // Delegation to service layer for overlapping time-slot verification
    const conflictMessage = await scheduleService.checkConflicts(req.body);
    if (conflictMessage) {
      return res.status(409).json({ message: conflictMessage });
    }

    const entry = await Schedule.create(req.body);
    
    // Hydrate associations graph before returning to ensure client updates its state instantly
    const fullyHydratedEntry = await Schedule.findByPk(entry.id, {
      include: [
        { model: Group, attributes: ['id', 'name'] },
        { model: User, as: 'Teacher', attributes: ['id', 'fullName'] },
        { model: Classroom, attributes: ['id', 'number', 'building'] },
        { model: Subject, attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json(fullyHydratedEntry);
  } catch (error) {
    console.error('Create Schedule Entry Error:', error.message);
    res.status(500).json({ message: 'Server error while creating schedule entry.', error: error.message });
  }
};

// Hot-swaps a teacher for an existing entry after verifying target availability
exports.replaceTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { TeacherId } = req.body;
    const institutionId = req.user.InstitutionId;

    const entry = await Schedule.findByPk(id, {
      include: [{ model: ScheduleVersion, where: { InstitutionId: institutionId } }]
    });

    if (!entry) {
      return res.status(404).json({ message: 'Schedule entry not found or access denied.' });
    }

    // SECURITY CHECK: Ensure the replacement teacher belongs to the same institution
    const replacementTeacher = await User.findOne({ where: { id: TeacherId, InstitutionId: institutionId, role: 'Teacher' } });
    if (!replacementTeacher) {
      return res.status(404).json({ message: 'The selected replacement teacher profile was not found within your institution.' });
    }

    const conflict = await Schedule.findOne({
      where: {
        dayOfWeek: entry.dayOfWeek,
        timeSlot: entry.timeSlot,
        TeacherId: TeacherId,
        ScheduleVersionId: entry.ScheduleVersionId
      }
    });

    if (conflict) {
      return res.status(409).json({ message: 'The selected teacher is already occupied during this explicit time slot.' });
    }

    entry.TeacherId = TeacherId;
    await entry.save();

    res.json({ message: 'Teacher replaced successfully.', entry });
  } catch (error) {
    console.error('Replace Teacher Error:', error.message);
    res.status(500).json({ message: 'Server error during teacher allocation swap.', error: error.message });
  }
};

// Modifies metadata for an existing schedule entry and checks for scheduling collisions
exports.updateScheduleEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    const entry = await Schedule.findByPk(id, {
      include: [{ model: ScheduleVersion, where: { InstitutionId: institutionId } }]
    });

    if (!entry) {
      return res.status(404).json({ message: 'Schedule entry not found or access denied.' });
    }

    const mergedPayload = {
      ...entry.toJSON(),
      ...req.body,
      ScheduleVersionId: entry.ScheduleVersionId
    };

    const conflictMessage = await scheduleService.checkConflicts(mergedPayload, id);
    if (conflictMessage) {
      return res.status(409).json({ message: conflictMessage });
    }

    await entry.update(req.body);

    // ФІКС 2: Повна гідрація об'єкта після оновлення для миттєвої реактивності на фронтенді
    const fullyHydratedUpdatedEntry = await Schedule.findByPk(id, {
      include: [
        { model: Group, attributes: ['id', 'name'] },
        { model: User, as: 'Teacher', attributes: ['id', 'fullName'] },
        { model: Classroom, attributes: ['id', 'number', 'building'] },
        { model: Subject, attributes: ['id', 'name'] }
      ]
    });

    res.json({ message: 'Schedule entry successfully updated.', entry: fullyHydratedUpdatedEntry });
  } catch (error) {
    console.error('Update Schedule Entry Error:', error.message);
    res.status(500).json({ message: 'Server error while updating schedule data.', error: error.message });
  }
};

// Generates and pipes an Excel binary spreadsheet stream for data export
exports.downloadExcel = async (req, res) => {
  try {
    // ФІКС 1: Зчитуємо versionId з req.query відповідно до нашого фронтенд-транспорту URL
    const { versionId } = req.query;
    const institutionId = req.user.InstitutionId;

    if (!versionId) {
      return res.status(400).json({ message: 'Missing required query parameter: versionId is mandatory.' });
    }

    const version = await ScheduleVersion.findOne({
      where: { id: versionId, InstitutionId: institutionId }
    });

    if (!version) {
      return res.status(403).json({ message: 'Access denied to target version datasets.' });
    }

    const workbook = await exportService.exportToExcel(versionId);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Schedule_${encodeURIComponent(version.name)}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel Export Error:', error.message);
    res.status(500).json({ message: 'Server error during Excel template compilation.', error: error.message });
  }
};

// Wipes out all generated schedule rows linked to a specific version
exports.clearVersionSchedule = async (req, res) => {
  try {
    const { versionId } = req.params;
    const institutionId = req.user.InstitutionId;

    const version = await ScheduleVersion.findOne({
      where: { id: versionId, InstitutionId: institutionId }
    });

    if (!version) {
      return res.status(403).json({ message: 'Access denied to target version datasets.' });
    }

    await Schedule.destroy({ where: { ScheduleVersionId: versionId } });
    res.json({ message: 'Target version schedule grid successfully cleared.' });
  } catch (error) {
    console.error('Clear Version Schedule Error:', error.message);
    res.status(500).json({ message: 'Server error while resetting version schedule data.', error: error.message });
  }
};