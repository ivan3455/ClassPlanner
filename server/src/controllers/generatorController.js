const generatorService = require('../services/generatorService');
const { User, Group, Classroom, TimeSettings, Curriculum } = require('../models');

exports.checkReadiness = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    const { versionId } = req.params;

    const [teachersCount, groupsCount, classroomsCount, timeSlotsCount, curriculumCount] = await Promise.all([
      User.count({ where: { InstitutionId: institutionId, role: 'Teacher' } }),
      Group.count({ where: { InstitutionId: institutionId } }),
      Classroom.count({ where: { InstitutionId: institutionId } }),
      TimeSettings.count({ where: { ScheduleVersionId: versionId } }),
      Curriculum.count({
        include: [{ model: Group, where: { InstitutionId: institutionId } }]
      })
    ]);

    const isReady = teachersCount > 0 && groupsCount > 0 && classroomsCount > 0 && timeSlotsCount > 0 && curriculumCount > 0;

    res.json({
      isReady,
      stats: { teachersCount, groupsCount, classroomsCount, timeSlotsCount, curriculumCount }
    });
  } catch (error) {
    console.error('Generator Readiness Check Error:', error.message);
    res.status(500).json({ message: 'Server error during data readiness validation.' });
  }
};

exports.runGenerator = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    const { versionId } = req.params;

    console.log(`🚀 [Event Loop]: Offloading version ${versionId} generation to an isolated Worker Thread...`);

    const result = await generatorService.runInWorker(versionId, institutionId);

    if (!result.success) {
      return res.status(422).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      message: result.message,
      placedLessons: result.placedLessons
    });
  } catch (error) {
    console.error('Generator Route Critical Error:', error.message);
    res.status(500).json({ message: 'Critical error within the generator core worker architecture.', error: error.message });
  }
};