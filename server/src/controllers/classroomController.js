const { Classroom, Schedule } = require('../models');

// Словник для мапінгу локалізованих назв з фронтенду в ENUM БД
const TYPE_MAPPING = {
  'Лекційна': 'Lecture',
  'Лабораторія': 'Laboratory',
  'Практична': 'Practical',
  'Комп\'ютерний клас': 'Computer Class',
  'General': 'General',
  'Lecture': 'Lecture',
  'Laboratory': 'Laboratory',
  'Computer Class': 'Computer Class'
};

// 1. Створення нової аудиторії
exports.createClassroom = async (req, res) => {
  try {
    const { number, capacity, type, ScheduleVersionId, building } = req.body;
    const institutionId = req.user.InstitutionId;

    // ВАЛІДАЦІЯ: Наявність усіх необхідних полів
    if (!number || !capacity || !type || !ScheduleVersionId) {
      return res.status(400).json({ 
        message: 'Missing required fields: number, capacity, type, and ScheduleVersionId are mandatory.' 
      });
    }

    const resolvedType = TYPE_MAPPING[type] || 'Lecture';
    const formattedNumber = number.trim();

    // ПЕРЕВІРКА НА ДУБЛІКАТИ: Аудиторія з таким номером вже є в цьому закладі?
    const classroomCollision = await Classroom.findOne({
      where: { 
        number: formattedNumber, 
        InstitutionId: institutionId,
        ScheduleVersionId: ScheduleVersionId 
      }
    });

    if (classroomCollision) {
      return res.status(400).json({ 
        message: `Classroom "${formattedNumber}" already exists in this schedule version.` 
      });
    }

    // СТВОРЕННЯ
    const classroom = await Classroom.create({
      number: formattedNumber,
      capacity: parseInt(capacity, 10),
      type: resolvedType,
      building: building ? building.trim() : 'Main',
      InstitutionId: institutionId,
      ScheduleVersionId: ScheduleVersionId // Тепер це поле завжди заповнене
    });

    res.status(201).json(classroom);
  } catch (error) {
    console.error('Create Classroom Error:', error.message);
    res.status(500).json({ message: 'Server error while creating classroom.', error: error.message });
  }
};

// 2. Отримання всіх аудиторій (з фільтром по InstitutionId)
exports.getAllClassrooms = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    const versionId = req.headers['x-schedule-version-id'];

    const whereClause = { InstitutionId: institutionId };
    if (versionId) {
      whereClause.ScheduleVersionId = versionId;
    }

    const classrooms = await Classroom.findAll({
      where: whereClause,
      order: [['number', 'ASC']]
    });

    res.json(classrooms);
  } catch (error) {
    console.error('Get Classrooms Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching classrooms.' });
  }
};

// 3. Оновлення аудиторії
exports.updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;
    const { number, capacity, type, building } = req.body;

    const classroom = await Classroom.findOne({ where: { id, InstitutionId: institutionId } });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or access denied.' });
    }

    const updateData = {};
    if (number) updateData.number = number.trim();
    if (capacity) updateData.capacity = parseInt(capacity, 10);
    if (type) updateData.type = TYPE_MAPPING[type] || type;
    if (building) updateData.building = building.trim();

    await classroom.update(updateData);
    res.json(classroom);
  } catch (error) {
    console.error('Update Classroom Error:', error.message);
    res.status(500).json({ message: 'Server error while updating classroom.' });
  }
};

// 4. Видалення аудиторії
exports.deleteClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    const classroom = await Classroom.findOne({ where: { id, InstitutionId: institutionId } });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }

    // ПЕРЕВІРКА ЦІЛІСНОСТІ: Чи не використовується аудиторія в активному розкладі?
    const hasActiveSchedule = await Schedule.findOne({ where: { ClassroomId: id } });
    if (hasActiveSchedule) {
      return res.status(400).json({ 
        message: 'Cannot delete: classroom is allocated in an active schedule.' 
      });
    }

    await classroom.destroy();
    res.json({ message: 'Classroom successfully deleted.' });
  } catch (error) {
    console.error('Delete Classroom Error:', error.message);
    res.status(500).json({ message: 'Server error while deleting classroom.' });
  }
};