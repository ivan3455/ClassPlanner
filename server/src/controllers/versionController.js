const { ScheduleVersion, Schedule, TimeSettings, BlockedSlot } = require('../models');
const { sequelize } = require('../config/db');

// Creates a new inactive schedule version linked to the coordinator's institution
exports.createVersion = async (req, res) => {
  try {
    // Extended parameters to feed the structural business rule constraints to the optimization engine
    const { 
      name, 
      academicYear, 
      daysPerWeek, 
      weekendDays, 
      allowSubgroups, 
      allowElectiveSimultaneity, 
      allowWindows 
    } = req.body;
    
    // CRITICAL FIX: Aligned with the global uppercase token convention
    const institutionId = req.user.InstitutionId;

    if (!name || !academicYear) {
      return res.status(400).json({ message: 'Missing core criteria. Version name and academicYear are mandatory.' });
    }

    const newVersion = await ScheduleVersion.create({
      name: name.trim(),
      academicYear: academicYear.trim(),
      daysPerWeek: parseInt(daysPerWeek, 10) || 5,
      weekendDays: weekendDays || 'Sunday',
      allowSubgroups: allowSubgroups !== undefined ? allowSubgroups : true,
      allowElectiveSimultaneity: allowElectiveSimultaneity !== undefined ? allowElectiveSimultaneity : false,
      allowWindows: allowWindows !== undefined ? allowWindows : true,
      InstitutionId: institutionId,
      isActive: false // Forces new versions to seed as drafts until explicitly activated
    });

    res.status(201).json(newVersion);
  } catch (error) {
    console.error('Create Version Error:', error.message);
    res.status(500).json({ message: 'Server error while initializing new schedule version.', error: error.message });
  }
};

// Activates a specific version making it the primary schedule layout for the institution
exports.activateVersion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    // Step 1: Systematically deactivate all ongoing versions for this multi-tenant channel
    await ScheduleVersion.update(
      { isActive: false }, 
      { where: { InstitutionId: institutionId }, transaction: t } 
    );

    // Step 2: Activate the targeting validated version instance
    const [updated] = await ScheduleVersion.update(
      { isActive: true }, 
      { where: { id, InstitutionId: institutionId }, transaction: t }
    );

    if (updated) {
      await t.commit();
      res.json({ message: 'Target schedule version successfully activated as primary layout.' });
    } else {
      await t.rollback();
      res.status(404).json({ message: 'Schedule version instance not found within your institution domain.' });
    }
  } catch (error) {
    await t.rollback();
    console.error('Activate Version Error:', error.message);
    res.status(500).json({ message: 'Server error during primary version mutation workflow.', error: error.message });
  }
};

// Retrieves all registered schedule versions bound to the authorized institution domain
exports.getVersions = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    
    const versions = await ScheduleVersion.findAll({
      where: { InstitutionId: institutionId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(versions);
  } catch (error) {
    console.error('Get Versions Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching schedule versions.' });
  }
};

// Deep-clones an entire schedule version, replicating its configuration parameters, rings, constraints, and generated layouts atomically
exports.duplicateVersion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    const original = await ScheduleVersion.findOne({
      where: { id, InstitutionId: institutionId }
    });

    if (!original) {
      await t.rollback();
      return res.status(404).json({ message: 'Source schedule version not found or access denied.' });
    }

    // Step 1: Clone the core layout entity node with all programmatic constraint settings
    const copy = await ScheduleVersion.create({
      name: `${original.name} (Copy)`,
      academicYear: original.academicYear,
      daysPerWeek: original.daysPerWeek,
      weekendDays: original.weekendDays,
      allowSubgroups: original.allowSubgroups,
      allowElectiveSimultaneity: original.allowElectiveSimultaneity,
      allowWindows: original.allowWindows,
      InstitutionId: institutionId,
      isActive: false // Keeps clones safe inside sandbox state
    }, { transaction: t });

    // Step 2: Replicate associated bell timeline settings rows
    const timeSettings = await TimeSettings.findAll({ where: { ScheduleVersionId: id } });
    if (timeSettings.length > 0) {
      const newTimeSettings = timeSettings.map(ts => ({
        orderNumber: ts.orderNumber,
        startTime: ts.startTime,
        endTime: ts.endTime,
        ScheduleVersionId: copy.id
      }));
      await TimeSettings.bulkCreate(newTimeSettings, { transaction: t });
    }

    // Step 3: EXTENSION FIX: Replicate associated structural holiday/weekend restrictions
    const blockedSlots = await BlockedSlot.findAll({ where: { ScheduleVersionId: id } });
    if (blockedSlots.length > 0) {
      const newBlockedSlots = blockedSlots.map(bs => ({
        specificDate: bs.specificDate,
        dayOfWeek: bs.dayOfWeek,
        startTime: bs.startTime,
        endTime: bs.endTime,
        reason: bs.reason,
        ScheduleVersionId: copy.id
      }));
      await BlockedSlot.bulkCreate(newBlockedSlots, { transaction: t });
    }

    // Step 4: Replicate existing generated grid rows (Pipes sandbox iterations forward)
    const entries = await Schedule.findAll({ where: { ScheduleVersionId: id } });
    if (entries.length > 0) {
      const newEntries = entries.map(e => ({
        dayOfWeek: e.dayOfWeek,
        timeSlot: e.timeSlot,
        type: e.type,
        isOnline: e.isOnline,
        GroupId: e.GroupId,
        SubjectId: e.SubjectId,
        TeacherId: e.TeacherId,
        ClassroomId: e.ClassroomId,
        ScheduleVersionId: copy.id
      }));
      await Schedule.bulkCreate(newEntries, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Schedule version and all algorithmic grid boundaries successfully deep-cloned.', newVersion: copy });
  } catch (error) {
    await t.rollback();
    console.error('Duplicate Version Error:', error.message);
    res.status(500).json({ message: 'Critical core error during deep-cloning routine execution.', error: error.message });
  }
};