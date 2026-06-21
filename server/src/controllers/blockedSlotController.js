const { BlockedSlot, ScheduleVersion } = require('../models');

// Retrieves all blocked time slots for a verified schedule version
exports.getBlockedSlotsByVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    
    // CRITICAL FIX: Realignment to match uniform token casing metadata (InstitutionId)
    const institutionId = req.user.InstitutionId;

    // Verifies data ownership before fetching slots to ensure strict multi-tenant isolation
    const version = await ScheduleVersion.findOne({
      where: { id: versionId, InstitutionId: institutionId }
    });

    if (!version) {
      return res.status(403).json({ message: 'Access denied or schedule version context not detected.' });
    }

    const slots = await BlockedSlot.findAll({
      where: { ScheduleVersionId: versionId },
      order: [
        ['specificDate', 'ASC'],
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
    
    res.json(slots);
  } catch (error) {
    console.error('Get Blocked Slots Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching blocked slots.', error: error.message });
  }
};

// Overwrites and batch-inserts blocked slots for a verified schedule version
exports.setBlockedSlots = async (req, res) => {
  try {
    const { versionId, slots } = req.body;
    const institutionId = req.user.InstitutionId;

    if (!versionId || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ message: 'Missing core parameters. versionId and slots array are mandatory.' });
    }

    // Verifies data ownership before mutating the database assets
    const version = await ScheduleVersion.findOne({
      where: { id: versionId, InstitutionId: institutionId }
    });

    if (!version) {
      return res.status(403).json({ message: 'Access denied. Unauthorized version mutation detected.' });
    }

    // Process logic filters and validation on incoming data packet
    const sanitizedSlots = [];

    for (const slot of slots) {
      const hasDate = slot.specificDate && slot.specificDate.trim() !== '';
      const hasDay = slot.dayOfWeek && slot.dayOfWeek.trim() !== '';

      // 1. Strict MUTUAL EXCLUSIVITY (XOR) Pre-validation
      if ((hasDate && hasDay) || (!hasDate && !hasDay)) {
        return res.status(400).json({
          message: 'Validation failed: A blocked slot execution target must declare EITHER a specificDate OR a dayOfWeek, but never both or neither.'
        });
      }

      const hasStart = slot.startTime && slot.startTime.trim() !== '';
      const hasEnd = slot.endTime && slot.endTime.trim() !== '';

      // 2. Intra-slot time presence evaluation
      if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
        return res.status(400).json({
          message: 'Validation failed: Partial time window defined. Both startTime and endTime must be specified together to block a custom fraction of the day.'
        });
      }

      // 3. Intra-slot chronological timeline verification
      if (hasStart && hasEnd) {
        const start = slot.startTime.trim();
        const end = slot.endTime.trim();
        
        if (start >= end) {
          return res.status(400).json({
            message: `Validation failed: Invalid time block chronological configuration (${start} -> ${end}). endTime must stand strictly after startTime.`
          });
        }
      }

      // Build safe object mapping
      sanitizedSlots.push({
        specificDate: hasDate ? slot.specificDate.trim() : null,
        dayOfWeek: hasDay ? slot.dayOfWeek.trim() : null,
        startTime: hasStart ? slot.startTime.trim() : null,
        endTime: hasEnd ? slot.endTime.trim() : null,
        reason: slot.reason ? slot.reason.trim() : null,
        ScheduleVersionId: versionId
      });
    }

    // Drops previous version constraints before overwriting (Atomic transaction style replace)
    await BlockedSlot.destroy({ where: { ScheduleVersionId: versionId } });

    if (sanitizedSlots.length > 0) {
      // CRITICAL: validate: true forces execution of structural model checks during batch loading
      const result = await BlockedSlot.bulkCreate(sanitizedSlots, { validate: true });
      return res.status(201).json(result);
    }
    
    res.json({ message: 'All blocked slots cleared for this version.' });
  } catch (error) {
    console.error('Set Blocked Slots Bulk Error:', error.message);
    res.status(500).json({ message: 'Server error while updating blocked slots matrix.', error: error.message });
  }
};