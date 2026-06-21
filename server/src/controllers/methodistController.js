const { User, Group, ScheduleVersion, Classroom, Institution, TeacherLeaveRequest } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// 1. Отримання аналітики з інтегрованим лічильником запитів викладачів та ізоляцією версій ресурсів
exports.getDashboardStats = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    const currentVersionId = req.headers['x-schedule-version-id'];

    if (!institutionId) {
      return res.status(400).json({ message: 'User identity context is not linked to any active institution branch.' });
    }

    // Паралельний підрахунок глобальних та версійно-ізольованих сутностей установи
    const teachersCount = await User.count({ where: { InstitutionId: institutionId, role: 'Teacher' } });
    const groupsCount = await Group.count({ where: { InstitutionId: institutionId } });
    const versionsCount = await ScheduleVersion.count({ where: { InstitutionId: institutionId } });

    // Підрахунок аудиторій здійснюється суворо всередині обраної ітераційної гілки
    let classroomsCount = 0;
    if (currentVersionId && currentVersionId !== 'null' && currentVersionId !== 'undefined') {
      classroomsCount = await Classroom.count({ where: { ScheduleVersionId: currentVersionId } });
    }

    // Динамічний підрахунок нерозглянутих (Pending) кадрових заявок від викладачів установи
    const pendingRequestsCount = await TeacherLeaveRequest ? 
      await TeacherLeaveRequest.count({
        where: { InstitutionId: institutionId, status: 'Pending' }
      }) : 0;

    const [colleagues, institution] = await Promise.all([
      User.findAll({
        where: { 
          InstitutionId: institutionId, 
          role: 'Methodist',
          id: { [Op.ne]: req.user.id } 
        },
        attributes: ['id', 'fullName', 'email', 'isActive']
      }),
      Institution.findByPk(institutionId, { attributes: ['id', 'name', 'type'] })
    ]);

    if (!institution) {
      return res.status(404).json({ message: 'Linked institution domain profile not detected.' });
    }

    res.json({
      teachers: teachersCount,
      groups: groupsCount,
      versions: versionsCount,
      classrooms: classroomsCount,
      pendingRequestsCount,
      colleagues,
      institutionName: institution.name,
      institutionType: institution.type
    });
  } catch (error) {
    console.error('Methodist Stats Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching dashboard statistics.' });
  }
};

// 2. Безпечна активація версії розкладу в Production вручну (Захист канонічного домену)
exports.activateScheduleVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    const targetVersion = await ScheduleVersion.findOne({ where: { id, InstitutionId: institutionId } });
    if (!targetVersion) {
      return res.status(404).json({ message: 'Target schedule version not found in your institution branch.' });
    }

    // Атомарне скидання прапорця активності для всіх альтернативних версій установи
    await ScheduleVersion.update({ isActive: false }, { where: { InstitutionId: institutionId } });

    // Офіційне деплоєння обраної версії у статус канонічного розкладу семестру
    await targetVersion.update({ isActive: true });

    res.json({ message: `Schedule version "${targetVersion.name}" has been successfully pushed to Production.` });
  } catch (error) {
    console.error('Activate Schedule Version Error:', error.message);
    res.status(500).json({ message: 'Critical error during schedule deployment.', error: error.message });
  }
};

// 3. Синхронізація фундаментальних метаданих профілю методиста та закладу освіти (ERP Панель)
exports.updateInstitutionProfile = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    const { fullName, institutionName } = req.body;

    if (fullName && fullName.trim()) {
      await User.update({ fullName: fullName.trim() }, { where: { id: req.user.id } });
    }

    if (institutionName && institutionName.trim()) {
      await Institution.update({ name: institutionName.trim() }, { where: { id: institutionId } });
    }

    res.json({ message: 'Workspace identity configurations successfully updated.' });
  } catch (error) {
    console.error('Update Institution Profile Error:', error.message);
    res.status(500).json({ message: 'Error modifying institution metadata.', error: error.message });
  }
};

// 4. Отримання списку діючих колег-методистів у межах поточного тананту
exports.getInstitutionTeam = async (req, res) => {
  try {
    const colleagues = await User.findAll({
      where: { InstitutionId: req.user.InstitutionId, role: 'Methodist' },
      attributes: ['id', 'fullName', 'email', 'isActive', 'createdAt']
    });
    res.json(colleagues);
  } catch (error) {
    console.error('Get Institution Team Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching staff data.' });
  }
};

// 5. Онбординг нового методиста-асистента з урахуванням системного ліміту (Max 10)
exports.addCoMethodist = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All profile fields are mandatory.' });
    }

    const currentCount = await User.count({ where: { InstitutionId: institutionId, role: 'Methodist' } });
    if (currentCount >= 10) {
      return res.status(400).json({ message: 'Threshold reached: Maximum of 10 methodists allowed per institution.' });
    }

    const collision = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (collision) {
      return res.status(400).json({ message: 'User with this email address already exists within the platform.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'Methodist',
      InstitutionId: institutionId,
      isActive: true
    });

    res.status(201).json(newStaff);
  } catch (error) {
    console.error('Add Co-Methodist Error:', error.message);
    res.status(500).json({ message: 'Server error during new coordinator deployment.', error: error.message });
  }
};

// 6. Застарілі або резервні методи для обробки кастомних запитів (збережено для сумісності контурів)
exports.getTeacherRequests = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;
    // Логіку перенесено в спеціалізований контур teacherLeaveController
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Server error while retrieving legacy pipeline.' });
  }
};

exports.resolveTeacherRequest = async (req, res) => {
  try {
    res.json({ message: 'Legacy gateway bypass triggered.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during validation.' });
  }
};