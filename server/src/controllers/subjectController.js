const { Subject, Curriculum, Schedule } = require('../models');

// Creates a new academic subject tied to the active coordinator's institution
exports.createSubject = async (req, res) => {
  try {
    const { name, shortName, code, totalHours, lectureHours, practiceHours, labHours, description } = req.body;
    
    // CRITICAL FIX: Realignment to match uniform token casing metadata
    const institutionId = req.user.InstitutionId;

    if (!name || !code) {
      return res.status(400).json({ message: 'Missing required fields: name and code are mandatory.' });
    }

    const formattedCode = code.trim().toUpperCase();

    // SECURITY CHECK: Enforce explicit uniqueness of subject code within the same institution
    const codeCollision = await Subject.findOne({
      where: { code: formattedCode, InstitutionId: institutionId }
    });
    if (codeCollision) {
      return res.status(400).json({ message: `An academic subject with code "${formattedCode}" already exists within your institution.` });
    }

    const parsedLectures = parseInt(lectureHours, 10) || 0;
    const parsedPractices = parseInt(practiceHours, 10) || 0;
    const parsedLabs = parseInt(labHours, 10) || 0;
    
    // LOGIC FIX: If totalHours is not specified, dynamically calculate it from the distribution metrics
    const calculatedTotal = parseInt(totalHours, 10) || (parsedLectures + parsedPractices + parsedLabs);

    // Business rule validation: Sum of distribution rows must not overflow the total allocated hours
    if (parsedLectures + parsedPractices + parsedLabs > calculatedTotal) {
      return res.status(400).json({ message: 'The sum of lecture, practice, and lab hours exceeds the specified total hours.' });
    }

    const subject = await Subject.create({
      name: name.trim(), 
      shortName: shortName ? shortName.trim() : null, 
      code: formattedCode, 
      totalHours: calculatedTotal, 
      lectureHours: parsedLectures, 
      practiceHours: parsedPractices, 
      labHours: parsedLabs, 
      description: description ? description.trim() : null,
      InstitutionId: institutionId 
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Create Subject Error:', error.message);
    res.status(500).json({ message: 'Server error while creating academic subject.', error: error.message });
  }
};

// Retrieves all academic subjects registered within the user's institution
exports.getAllSubjects = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;

    const subjects = await Subject.findAll({
      where: { InstitutionId: institutionId },
      order: [['name', 'ASC']]
    });

    res.json(subjects);
  } catch (error) {
    console.error('Get All Subjects Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching academic subjects.' });
  }
};

// Updates subject metadata after verifying multi-tenancy access rights
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;
    const { name, shortName, code, totalHours, lectureHours, practiceHours, labHours, description } = req.body;

    const subject = await Subject.findOne({ where: { id, InstitutionId: institutionId } });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or access denied.' });
    }

    const updateData = {};

    if (code) {
      const formattedCode = code.trim().toUpperCase();
      if (formattedCode !== subject.code) {
        const codeCollision = await Subject.findOne({ where: { code: formattedCode, InstitutionId: institutionId } });
        if (codeCollision) {
          return res.status(400).json({ message: `Code "${formattedCode}" is already claimed by another subject resource.` });
        }
        updateData.code = formattedCode;
      }
    }

    if (name !== undefined) updateData.name = name.trim();
    if (shortName !== undefined) updateData.shortName = shortName ? shortName.trim() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;

    // Recalculate and validate hourly distribution constraints during update sequence
    const finalLectures = lectureHours !== undefined ? (parseInt(lectureHours, 10) || 0) : subject.lectureHours;
    const finalPractices = practiceHours !== undefined ? (parseInt(practiceHours, 10) || 0) : subject.practiceHours;
    const finalLabs = labHours !== undefined ? (parseInt(labHours, 10) || 0) : subject.labHours;
    const finalTotal = totalHours !== undefined ? (parseInt(totalHours, 10) || 0) : subject.totalHours;

    if (finalLectures + finalPractices + finalLabs > finalTotal) {
      return res.status(400).json({ message: 'Updated hourly distribution violates total allocated hours balance constraint.' });
    }

    updateData.lectureHours = finalLectures;
    updateData.practiceHours = finalPractices;
    updateData.labHours = finalLabs;
    updateData.totalHours = finalTotal;

    await subject.update(updateData);
    res.json(subject);
  } catch (error) {
    console.error('Update Subject Error:', error.message);
    res.status(500).json({ message: 'Server error while updating subject metadata.', error: error.message });
  }
};

// Deletes an academic subject only if it is not referenced by active curriculums or generated schedules
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    const subject = await Subject.findOne({ where: { id, InstitutionId: institutionId } });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or access denied.' });
    }

    // Data Integrity Enforcement: Block delete if subject is active in curriculum tasks or generated grid
    const [linkedCurriculum, linkedSchedule] = await Promise.all([
      Curriculum.findOne({ where: { SubjectId: id } }),
      Schedule.findOne({ where: { SubjectId: id } })
    ]);

    if (linkedCurriculum || linkedSchedule) {
      return res.status(400).json({ 
        message: 'Cannot delete subject: it is currently referenced by an active curriculum group plan or an active generated schedule.' 
      });
    }

    await subject.destroy();
    res.json({ message: 'Academic subject deleted successfully.' });
  } catch (error) {
    console.error('Delete Subject Error:', error.message);
    res.status(500).json({ message: 'Server error while deleting academic subject.', error: error.message });
  }
};