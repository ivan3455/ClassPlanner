const { TeacherConstraint, User } = require('../models');

// Overwrites and batch-inserts constraint slots for a teacher
exports.setTeacherConstraints = async (req, res) => {
  try {
    const { TeacherId, constraints } = req.body; 
    const institutionId = req.user.InstitutionId;

    if (!TeacherId || !constraints || !Array.isArray(constraints)) {
      return res.status(400).json({ 
        message: 'Invalid payload structure. TeacherId and active constraints array are mandatory.' 
      });
    }

    // Security Verification: Double-check that teacher belongs to the user's institution
    const teacher = await User.findOne({ 
      where: { id: TeacherId, InstitutionId: institutionId, role: 'Teacher' } 
    });

    if (!teacher) {
      return res.status(403).json({ 
        message: 'Access denied: target teacher does not belong to your institution.' 
      });
    }

    // ФІКС: Вилучено неіснуючий ScheduleVersionId з критеріїв очищення
    await TeacherConstraint.destroy({ 
      where: { TeacherId } 
    });

    if (constraints.length === 0) {
      return res.json({ message: 'All scheduling constraints cleared successfully for this teacher.' });
    }

    // Validate and build sanitized constraint database records
    const sanitizedConstraints = [];
    for (const item of constraints) {
      if (!item.dayOfWeek || !item.timeSlot) {
        return res.status(400).json({ message: 'Validation failed: Each constraint block must contain dayOfWeek and timeSlot.' });
      }

      // Розбиваємо "08:30 - 10:00" на startTime та endTime відповідно до твоєї моделі TeacherConstraint
      const [startTime, endTime] = item.timeSlot.split('-').map(t => t.trim());

      sanitizedConstraints.push({
        dayOfWeek: item.dayOfWeek.trim(),
        startTime: startTime,
        endTime: endTime,
        TeacherId
      });
    }

    const newConstraints = await TeacherConstraint.bulkCreate(sanitizedConstraints, { validate: true });
    res.status(201).json(newConstraints);
  } catch (error) {
    console.error('Set Teacher Constraints Error:', error.message);
    res.status(500).json({ message: 'Server error while updating teacher schedule constraints.', error: error.message });
  }
};

// Retrieves constraints for a specific teacher
exports.getTeacherConstraints = async (req, res) => {
  try {
    const { teacherId } = req.query;
    const institutionId = req.user.InstitutionId;

    if (!teacherId) {
      return res.status(400).json({ message: 'Missing required query parameters: teacherId is mandatory.' });
    }

    // Перевіряємо, чи належить викладач до цієї установи
    const teacherCheck = await User.findOne({
      where: { id: teacherId, InstitutionId: institutionId }
    });

    if (!teacherCheck) {
      return res.status(403).json({ message: 'Access denied. Teacher not found within your institution.' });
    }

    // ФІКС: Вилучено неіснуюче поле ScheduleVersionId з пошуку findAll
    const constraints = await TeacherConstraint.findAll({
      where: { TeacherId: teacherId },
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });
    
    res.json(constraints);
  } catch (error) {
    console.error('Get Teacher Constraints Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching teacher constraint records.' });
  }
};