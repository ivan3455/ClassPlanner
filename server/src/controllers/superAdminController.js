const { Institution, User, InstitutionRequest, Schedule, ScheduleVersion } = require('../models');
const emailService = require('../services/emailService'); // Пряме архітектурне підключення сервісу пошти
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// 1. Setup institution and deploy the first root methodist account
exports.createInstitutionWithMethodist = async (req, res) => {
  try {
    const { instName, instType, department, methodistName, methodistEmail, methodistPassword, requestId } = req.body;

    if (!instName || !instType || !methodistName || !methodistEmail || !methodistPassword) {
      return res.status(400).json({ message: 'All configuration fields are required for initial deployment.' });
    }

    const existingUser = await User.findOne({ where: { email: methodistEmail.trim().toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email address is already registered in the system.' });
    }

    const institution = await Institution.create({ 
      name: instName.trim(),
      type: instType,
      department: department ? department.trim() : null
    });

    const hashedPassword = await bcrypt.hash(methodistPassword, 10);

    await User.create({
      fullName: methodistName.trim(),
      email: methodistEmail.trim().toLowerCase(),
      password: hashedPassword,
      role: 'Methodist',
      InstitutionId: institution.id,
      isActive: true
    });

    if (requestId) {
      await InstitutionRequest.update(
        { status: 'Approved' },
        { where: { id: requestId } }
      );
      console.log(`[SaaS Gateway]: Inbound request ${requestId} marked as Approved.`);
    }

    // --- АСИНХРОННА ВІДПРАВКА ЕМЕЙЛУ МЕТОДИСТУ (Mailtrap / NodeMailer) ---
    // Викликаємо без await із перехопленням помилок, щоб не блокувати HTTP-відповідь сервера
    emailService.sendOnboardingEmail(
      methodistEmail.trim().toLowerCase(),
      methodistName.trim(),
      instName.trim(),
      methodistPassword
    ).catch(err => {
      console.error('[Email Service Background Error]: Фонова помилка відправки листа:', err.message);
    });

    res.status(201).json({ message: 'Institution infrastructure successfully deployed and account activated.' });
  } catch (error) {
    console.error('Setup Institution Error:', error.message);
    res.status(500).json({ message: 'Server error during institution onboarding initialization.', error: error.message });
  }
};

// 2. Retrieve all managed institutions with their active methodist personnel
exports.getAllInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.findAll({
      include: [{
        model: User,
        where: { role: 'Methodist' },
        required: false,
        attributes: ['id', 'fullName', 'email', 'isActive', 'createdAt']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(institutions);
  } catch (error) {
    console.error('Get Institutions Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching institution registry.' });
  }
};

// 3. Modify fundamental institutional identity values
exports.updateInstitutionData = async (req, res) => {
  try {
    const { instId } = req.params;
    const { instName, type, department } = req.body;

    const institution = await Institution.findByPk(instId);
    if (!institution) {
      return res.status(404).json({ message: 'Institution profile not found.' });
    }

    await institution.update({ 
      name: instName ? instName.trim() : institution.name,
      type: type || institution.type,
      department: department !== undefined ? department.trim() : institution.department
    });

    res.json({ message: 'Institution meta properties synchronized successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update institution metrics.', error: error.message });
  }
};

// 4. Onboard a NEW methodist to an existing tenant under a strict rate limit
exports.addMethodistToInstitution = async (req, res) => {
  try {
    const { instId } = req.params;
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All profile identification criteria must be provided.' });
    }

    const methodistCount = await User.count({
      where: { InstitutionId: instId, role: 'Methodist' }
    });

    if (methodistCount >= 10) {
      return res.status(400).json({ 
        message: 'System threshold reached: An institution branch cannot maintain more than 10 active methodist profiles.' 
      });
    }

    const existingUser = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ message: 'An identity utilizing this email descriptor already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMethodist = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'Methodist',
      InstitutionId: instId,
      isActive: true
    });

    res.status(201).json(newMethodist);
  } catch (error) {
    res.status(500).json({ message: 'Failed to append methodist resource to tenant context.', error: error.message });
  }
};

// 5. Modify and save an existing methodist identity card
exports.updateMethodistUser = async (req, res) => {
  try {
    const { methodistId } = req.params;
    const { fullName, email, isActive } = req.body;

    const user = await User.findOne({ where: { id: methodistId, role: 'Methodist' } });
    if (!user) {
      return res.status(404).json({ message: 'Methodist profile not detected within system boundaries.' });
    }

    const updateData = {
      fullName: fullName ? fullName.trim() : user.fullName,
      isActive: isActive !== undefined ? isActive : user.isActive
    };

    if (email && email.trim().toLowerCase() !== user.email) {
      const formattedEmail = email.trim().toLowerCase();
      const emailCollision = await User.findOne({ where: { email: formattedEmail } });
      if (emailCollision) {
        return res.status(400).json({ message: 'Target email is already claimed by another system profile.' });
      }
      updateData.email = formattedEmail;
    }

    await user.update(updateData);

    const freshlyHydratedUser = await User.findByPk(methodistId, {
      attributes: ['id', 'fullName', 'email', 'isActive', 'InstitutionId', 'createdAt']
    });

    res.json(freshlyHydratedUser);
  } catch (error) {
    console.error('Update Methodist Error:', error.message);
    res.status(500).json({ message: 'Error updating methodist identity variables.', error: error.message });
  }
};

// 6. Append an institution to the delayed deletion queue (48-hour Grace Window)
exports.deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await Institution.findByPk(id);
    
    if (!institution) {
      return res.status(404).json({ message: 'Target institution context missing.' });
    }

    await institution.update({ deletionRequestedAt: new Date() });
    
    await User.update(
      { isActive: false },
      { where: { InstitutionId: id } }
    );

    res.json({ message: 'Decommission sequence initiated. Institution moved to soft-delete queue. Purge executes in 48 hours.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deploying deletion request stamp.', error: error.message });
  }
};

// Abort destruction pipeline and re-state system functionality for a tenant
exports.restoreInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await Institution.findByPk(id);

    if (!institution) {
      return res.status(404).json({ message: 'Institution profile not found.' });
    }

    await institution.update({ deletionRequestedAt: null });
    
    await User.update(
      { isActive: true },
      { where: { InstitutionId: id } }
    );

    res.json({ message: 'Destruction request successfully intercepted. Institution state restored to active production.' });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring operational properties to institution.', error: error.message });
  }
};

// Permanently drop an individual methodist staff record from the core roster
exports.deleteMethodist = async (req, res) => {
  try {
    const { methodistId } = req.params;
    const user = await User.findOne({ where: { id: methodistId, role: 'Methodist' } });

    if (!user) {
      return res.status(404).json({ message: 'Methodist allocation target not found or holds mismatched system roles.' });
    }

    await user.destroy();
    res.json({ message: 'Methodist identity cleanly purged from database tables.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to extract methodist entity from platform registry.', error: error.message });
  }
};

// 7. Extract ONLY true Pending requests to prevent approved ones from staying in the queue
exports.getRequests = async (req, res) => {
  try {
    const requests = await InstitutionRequest.findAll({ 
      where: { status: 'Pending' }, 
      order: [['createdAt', 'ASC']] 
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to access queue data arrays.', error: error.message });
  }
};

// Reject an onboarding application explicitly to keep historical context clean
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await InstitutionRequest.findByPk(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Target application request not found.' });
    }

    await request.update({ status: 'Rejected' });
    res.json({ message: 'Inbound application successfully shifted to Rejected state.' });
  } catch (error) {
    res.status(500).json({ message: 'Error shifting application status values.', error: error.message });
  }
};

// AUTOMATED WORKER INTERACTION PASS: Scans and drops expired entities permanently from database records
exports.purgeExpiredInstitutions = async () => {
  try {
    const thresholdDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // Current execution timeline minus 48 hours
    
    const expiredTenants = await Institution.findAll({
      where: {
        deletionRequestedAt: {
          [Op.not]: null,
          [Op.lte]: thresholdDate
        }
      }
    });

    if (expiredTenants.length === 0) return;

    console.log(`[Cron Engine]: Found ${expiredTenants.length} expired institution assets flagged for destruction.`);

    for (const tenant of expiredTenants) {
      await User.destroy({ where: { InstitutionId: tenant.id } });
      await tenant.destroy(); 
      console.log(`[Cron Engine]: Multi-tenant domain "${tenant.name}" (ID: ${tenant.id}) permanently purged.`);
    }
  } catch (error) {
    console.error('[Cron Engine Critical Error]: Exception caught inside automated destruction loop:', error.message);
  }
};