const { Curriculum, Group, Subject, User, Schedule } = require('../models');

// Creates a curriculum entry after verifying that the referenced group and subject belong to the coordinator's institution
exports.createCurriculum = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    const { GroupId, subjectName, TeacherId, lectureHours, practiceHours, labHours, ScheduleVersionId } = req.body;

    if (!GroupId || !subjectName || !ScheduleVersionId) {
      return res.status(400).json({ message: 'Missing required parameters: GroupId, subjectName, and ScheduleVersionId are mandatory.' });
    }

    const subjectCode = subjectName.trim().substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);

    // FIX: Передаємо ScheduleVersionId при пошуку/створенні предмета
    const [subject] = await Subject.findOrCreate({
      where: { 
        name: subjectName.trim(), 
        InstitutionId: institutionId,
        ScheduleVersionId: ScheduleVersionId 
      },
      defaults: {
        code: subjectCode,
        totalHours: 0,
        ScheduleVersionId: ScheduleVersionId
      }
    });

    const group = await Group.findOne({ where: { id: GroupId, InstitutionId: institutionId } });
    if (!group) {
      return res.status(403).json({ message: 'Target academic group does not belong to your institution branch.' });
    }

    if (TeacherId) {
      const activeTeacher = await User.findOne({ where: { id: TeacherId, InstitutionId: institutionId, role: 'Teacher' } });
      if (!activeTeacher) {
        return res.status(404).json({ message: 'The designated recommended teacher was not found.' });
      }
    }

    const parsedLecture = parseInt(lectureHours, 10) || 0;
    const parsedPractice = parseInt(practiceHours, 10) || 0;
    const parsedLab = parseInt(labHours, 10) || 0;
    const computedHoursPerSemester = (parsedLecture + parsedPractice + parsedLab) * 15;

    // FIX: Передаємо ScheduleVersionId при створенні навантаження
    const curriculum = await Curriculum.create({
      GroupId,
      SubjectId: subject.id,
      TeacherId: TeacherId || null,
      lectureHours: parsedLecture,
      practiceHours: parsedPractice,
      labHours: parsedLab,
      hoursPerSemester: computedHoursPerSemester,
      ScheduleVersionId: ScheduleVersionId 
    });

    const fullCreatedEntry = await Curriculum.findByPk(curriculum.id, {
      include: [
        { model: Group, attributes: ['name'] },
        { model: Subject, attributes: ['name'] },
        { model: User, as: 'RecommendedTeacher', attributes: ['fullName'] }
      ]
    });

    res.status(201).json(fullCreatedEntry);
  } catch (error) {
    console.error('Create Curriculum Error:', error.message);
    res.status(500).json({ message: 'Server error while creating curriculum entry.', error: error.message });
  }
};

// Retrieves the specific curriculum plan for a verified institution group
exports.getGroupCurriculum = async (req, res) => {
  try {
    const { groupId } = req.params;
    const institutionId = req.user.InstitutionId;

    const group = await Group.findOne({ where: { id: groupId, InstitutionId: institutionId } });
    if (!group) {
      return res.status(403).json({ message: 'Access denied or target group context not detected.' });
    }

    const plan = await Curriculum.findAll({
      where: { GroupId: groupId },
      include: [
        { model: Subject, attributes: ['name', 'code'] },
        { model: User, as: 'RecommendedTeacher', attributes: ['fullName'] }
      ]
    });
    
    res.json(plan);
  } catch (error) {
    console.error('Get Group Curriculum Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching group curriculum.', error: error.message });
  }
};

// Retrieves all curriculum entries bound to the coordinator's institution
exports.getAllCurriculums = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;

    // Отримуємо спочатку всі ID груп цієї інституції, щоб зробити чистий запит без вкладених конфліктних колізій WHERE в JOIN
    const allowedGroups = await Group.findAll({
      where: { InstitutionId: institutionId },
      attributes: ['id']
    });
    const groupIds = allowedGroups.map(g => g.id);

    const curriculums = await Curriculum.findAll({
      where: { GroupId: groupIds },
      include: [
        { model: Group, attributes: ['name'] },
        { model: Subject, attributes: ['name', 'code'] },
        { model: User, as: 'RecommendedTeacher', attributes: ['fullName'] }
      ],
      order: [['id', 'DESC']]
    });
    
    res.json(curriculums);
  } catch (error) {
    console.error('Get All Curriculums Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching all curriculums.', error: error.message });
  }
};

// Updates a specific curriculum entry and dynamically recalculates semester workload totals
exports.updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;
    const { TeacherId, lectureHours, practiceHours, labHours } = req.body;

    const curriculumEntry = await Curriculum.findByPk(id, {
      include: [{ model: Group, attributes: ['InstitutionId'] }]
    });

    if (!curriculumEntry || curriculumEntry.Group.InstitutionId !== institutionId) {
      return res.status(403).json({ message: 'Curriculum entry not found or access denied within this domain.' });
    }

    const updateData = { ...req.body };

    if (TeacherId) {
      const activeTeacher = await User.findOne({ where: { id: TeacherId, InstitutionId: institutionId, role: 'Teacher' } });
      if (!activeTeacher) {
        return res.status(404).json({ message: 'Requested teacher reassignment parameter is unmapped or invalid.' });
      }
    }

    const finalLectures = lectureHours !== undefined ? (parseInt(lectureHours, 10) || 0) : curriculumEntry.lectureHours;
    const finalPractices = practiceHours !== undefined ? (parseInt(practiceHours, 10) || 0) : curriculumEntry.practiceHours;
    const finalLabs = labHours !== undefined ? (parseInt(labHours, 10) || 0) : curriculumEntry.labHours;

    const totalWeeksInSemester = 15;
    updateData.hoursPerSemester = (finalLectures + finalPractices + finalLabs) * totalWeeksInSemester;

    await curriculumEntry.update(updateData);
    
    const updatedModelGraph = await Curriculum.findByPk(id, {
      include: [
        { model: Subject, attributes: ['name'] },
        { model: Group, attributes: ['name'] },
        { model: User, as: 'RecommendedTeacher', attributes: ['fullName'] }
      ]
    });

    res.json(updatedModelGraph);
  } catch (error) {
    console.error('Update Curriculum Error:', error.message);
    res.status(500).json({ message: 'Server error while updating curriculum data.', error: error.message });
  }
};

// Deletes a curriculum entry if it is not currently utilized by an active generated schedule
exports.deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    const entry = await Curriculum.findByPk(id, {
      include: [{ model: Group, attributes: ['InstitutionId'] }]
    });

    if (!entry || entry.Group.InstitutionId !== institutionId) {
      return res.status(403).json({ message: 'Curriculum entry not found or access denied.' });
    }

    const linkedSchedule = await Schedule.findOne({ 
      where: { 
        GroupId: entry.GroupId, 
        SubjectId: entry.SubjectId 
      } 
    });

    if (linkedSchedule) {
      return res.status(400).json({ 
        message: 'Cannot extract entry: this subject assignment is actively utilized within deployed schedule calendars.' 
      });
    }

    await entry.destroy();
    res.json({ message: 'Subject successfully removed from the curriculum plan.' });
  } catch (error) {
    console.error('Delete Curriculum Error:', error.message);
    res.status(500).json({ message: 'Server error while deleting curriculum entry.', error: error.message });
  }
};