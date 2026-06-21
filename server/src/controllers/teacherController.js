const { User, Teacher } = require('../models');
const bcrypt = require('bcryptjs');

// Retrieves all teachers registered within the active coordinator's institution along with metadata
exports.getAllTeachers = async (req, res) => {
  try {
    // CRITICAL FIX: Casing aligned to use uniform Tenant Isolation identifier (InstitutionId)
    const institutionId = req.user.InstitutionId;

    const teachers = await User.findAll({
      where: { 
        InstitutionId: institutionId,
        role: 'Teacher'
      },
      attributes: ['id', 'fullName', 'email', 'isActive', 'createdAt'], 
      // EXTENSION FIX: Include the extended Teacher profile variables (department, preferences)
      include: [{
        model: Teacher,
        attributes: ['id', 'department', 'preferences']
      }],
      order: [['fullName', 'ASC']]
    });

    res.json(teachers);
  } catch (error) {
    console.error('Get All Teachers Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching teachers list.' });
  }
};

// Registers a new teacher under the coordinator's institution context
exports.registerTeacher = async (req, res) => {
  try {
    const { fullName, email, password, department, preferences } = req.body;
    const institutionId = req.user.InstitutionId;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields: fullName, email, and password are mandatory.' });
    }

    const formattedEmail = email.trim().toLowerCase();
    const candidate = await User.findOne({ where: { email: formattedEmail } });
    if (candidate) {
      return res.status(400).json({ message: 'User with this email already exists within the platform.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Deployment of base identity credentials
    const newTeacherUser = await User.create({
      fullName: fullName.trim(),
      email: formattedEmail,
      password: hashedPassword,
      role: 'Teacher',
      InstitutionId: institutionId,
      isActive: true
    });

    // EXTENSION FIX: Explicitly setup the child One-to-One record inside the Teachers extension table
    const extendedProfile = await Teacher.create({
      UserId: newTeacherUser.id,
      department: department ? department.trim() : null,
      preferences: preferences || {}
    });

    res.status(201).json({
      message: 'Teacher account successfully registered.',
      teacher: {
        id: newTeacherUser.id,
        fullName: newTeacherUser.fullName,
        email: newTeacherUser.email,
        department: extendedProfile.department,
        preferences: extendedProfile.preferences
      }
    });
  } catch (error) {
    console.error('Register Teacher Error:', error.message);
    res.status(500).json({ message: 'Server error during teacher staff registration.' });
  }
};

// NEW METHOD: Updates both base user fields and extended teacher metadata
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, password, isActive, department, preferences } = req.body;
    const institutionId = req.user.InstitutionId;

    // Fetch user ensuring they belong to the same institution for multi-tenant safety
    const teacherUser = await User.findOne({
      where: { id, InstitutionId: institutionId, role: 'Teacher' },
      include: [Teacher]
    });

    if (!teacherUser) {
      return res.status(404).json({ message: 'Teacher profile not found within your institution context.' });
    }

    const userUpdateData = {
      fullName: fullName ? fullName.trim() : teacherUser.fullName,
      isActive: isActive !== undefined ? isActive : teacherUser.isActive
    };

    if (email && email.trim().toLowerCase() !== teacherUser.email) {
      const formattedEmail = email.trim().toLowerCase();
      const emailCollision = await User.findOne({ where: { email: formattedEmail } });
      if (emailCollision) {
        return res.status(400).json({ message: 'Email target is already claimed by another active identity.' });
      }
      userUpdateData.email = formattedEmail;
    }

    if (password && password.trim() !== '') {
      userUpdateData.password = await bcrypt.hash(password, 12);
    }

    // Save core user table changes
    await teacherUser.update(userUpdateData);

    // Save extension profile table changes if present
    if (teacherUser.Teacher) {
      await teacherUser.Teacher.update({
        department: department !== undefined ? department.trim() : teacherUser.Teacher.department,
        preferences: preferences || teacherUser.Teacher.preferences
      });
    }

    res.json({ message: 'Teacher record updated successfully.' });
  } catch (error) {
    console.error('Update Teacher Error:', error.message);
    res.status(500).json({ message: 'Server error while modifying teacher records.' });
  }
};

// NEW METHOD: Hard deletes teacher user account and automatically cascades to profile extensions
exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    const teacherUser = await User.findOne({
      where: { id, InstitutionId: institutionId, role: 'Teacher' }
    });

    if (!teacherUser) {
      return res.status(404).json({ message: 'Teacher target not found or resides outside tenant scope.' });
    }

    // Database associations setup automatically clears records from the Teacher profile extensions table on cascade
    await teacherUser.destroy();
    res.json({ message: 'Teacher account completely removed from system rosters.' });
  } catch (error) {
    console.error('Delete Teacher Error:', error.message);
    res.status(500).json({ message: 'Server error during extraction of teacher resource.' });
  }
};