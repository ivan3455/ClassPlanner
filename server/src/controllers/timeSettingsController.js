const { TimeSettings, ScheduleVersion } = require('../models');

// Overwrites and bulk-inserts the bell schedule (time matrix slots) for a verified institution version
exports.setTimeSettings = async (req, res) => {
  try {
    const { versionId, slots } = req.body;
    const institutionId = req.user.InstitutionId;

    if (!versionId || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ message: 'Missing parameters. Contextual versionId and slots array are mandatory.' });
    }

    // Verify user access rights to this schedule version via institution context
    const version = await ScheduleVersion.findOne({
      where: { id: versionId, InstitutionId: institutionId }
    });

    if (!version) {
      return res.status(403).json({ 
        message: 'Access denied: target schedule version instance does not belong to your institution.' 
      });
    }

    // Filter and sanitize incoming slot rows
    const validSlots = slots
      .filter(s => s.startTime && s.endTime && s.startTime.trim() !== '' && s.endTime.trim() !== '')
      .map((s) => ({
        startTime: s.startTime.trim(),
        endTime: s.endTime.trim(),
        ScheduleVersionId: versionId
      }));

    if (validSlots.length === 0) {
      return res.status(400).json({ message: 'Validation failed. Please configure time values for at least one lesson slot.' });
    }

    // SORTING & BULK TIMELINE VALIDATION:
    // Sort slots by startTime to execute sequential chronological verification
    validSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 0; i < validSlots.length; i++) {
      const current = validSlots[i];
      
      // 1. Core intra-slot chronological check
      if (current.startTime >= current.endTime) {
        return res.status(400).json({ 
          message: `Validation failed: Slot starting at ${current.startTime} has an endTime equal to or prior to startTime.` 
        });
      }

      // 2. Inter-slot overlap check (compare current slot with the next one)
      if (i < validSlots.length - 1) {
        const next = validSlots[i + 1];
        if (current.endTime > next.startTime) {
          return res.status(400).json({ 
            message: `Validation failed: Time collision detected between consecutive slots. Slot ending at ${current.endTime} overlaps with next slot starting at ${next.startTime}.` 
          });
        }
      }

      // Assign sequential ordered lesson/period number after sorting passes validation
      current.orderNumber = i + 1;
    }

    // Execute atomic replace operation
    await TimeSettings.destroy({ where: { ScheduleVersionId: versionId } });
    
    // CRITICAL: validate: true ensures database column validations run on bulk inputs
    const createdSlots = await TimeSettings.bulkCreate(validSlots, { validate: true });

    res.status(201).json({
      message: 'Bell schedule configuration successfully synchronized.',
      count: createdSlots.length
    });
  } catch (error) {
    console.error('Set Time Settings Bulk Error:', error.message);
    res.status(500).json({ 
      message: 'Server error while modifying time configuration matrix.', 
      error: error.message 
    });
  }
};

// Retrieves ordered bell schedule rings for a verified schedule version
exports.getTimeSettings = async (req, res) => {
  try {
    const { versionId: incomingId } = req.params; 
    const institutionId = req.user.InstitutionId;

    console.log(`📡 Fetching timings. Institution: ${institutionId}, URL Parameter: ${incomingId}`);

    let targetVersionId = incomingId;

    // Fallback logic if the client requests settings directly by passing the institution ID
    if (incomingId === institutionId) {
      let defaultVersion = await ScheduleVersion.findOne({
        where: { InstitutionId: institutionId },
        order: [['createdAt', 'ASC']]
      });

      if (!defaultVersion) {
        console.log(`📝 No schedule versions found for institution ${institutionId}. Deploying default root layout...`);
        
        // Aligned with the updated Model criteria: removed 'status' and added mandatory 'academicYear'
        const currentYear = new Date().getFullYear();
        defaultVersion = await ScheduleVersion.create({
          name: 'Main Schedule Version',
          academicYear: `${currentYear}/${currentYear + 1}`,
          daysPerWeek: 5,
          weekendDays: 'Sunday',
          allowSubgroups: false,
          allowElectiveSimultaneity: false,
          allowWindows: true,
          isActive: true,
          InstitutionId: institutionId
        });
      }
      targetVersionId = defaultVersion.id;
    } else {
      const version = await ScheduleVersion.findOne({
        where: { id: incomingId, InstitutionId: institutionId }
      });

      if (!version) {
        return res.status(403).json({ message: 'Access denied or target schedule version not found for your institution.' });
      }
    }

    const settings = await TimeSettings.findAll({
      where: { ScheduleVersionId: targetVersionId },
      order: [['orderNumber', 'ASC']]
    });

    res.json(settings);
  } catch (error) {
    console.error('Get Time Settings Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching time ring datasets.', error: error.message });
  }
};