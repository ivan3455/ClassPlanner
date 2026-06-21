const { Group, Schedule } = require('../models');

// Creates a new student group (or subgroup/virtual group) bound to the coordinator's institution
exports.createGroup = async (req, res) => {
  try {
    // Extended to support structural grouping variables: type and parentGroupId
    const { name, studentCount, course, specialization, type, parentGroupId } = req.body;
    
    // CRITICAL FIX: Realignment to match uniform token casing metadata
    const institutionId = req.user.InstitutionId;

    if (!name || !studentCount || !course) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, studentCount, and course are mandatory.' 
      });
    }

    // MULTI-TENANT CHECK: Enforce explicit uniqueness of group name within the same institution
    const nameCollision = await Group.findOne({
      where: { name: name.trim(), InstitutionId: institutionId }
    });
    if (nameCollision) {
      return res.status(400).json({ message: `An academic group named "${name.trim()}" already exists within your institution.` });
    }

    // SUBGROUP SECURITY CHECK: Verify parent group presence and ownership if parentGroupId is submitted
    if (parentGroupId) {
      const parentGroup = await Group.findOne({ where: { id: parentGroupId, InstitutionId: institutionId } });
      if (!parentGroup) {
        return res.status(404).json({ message: 'Specified parent group not found or belongs to another institution branch.' });
      }
    }

    const group = await Group.create({ 
      name: name.trim(), 
      studentCount: parseInt(studentCount, 10), 
      course: parseInt(course, 10), 
      specialization: specialization ? specialization.trim() : null,
      type: type || 'RadioGroup', // Defaults to a standard standalone class/group
      parentGroupId: parentGroupId || null,
      InstitutionId: institutionId 
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Create Group Error:', error.message);
    res.status(500).json({ message: 'Server error while creating student group.', error: error.message });
  }
};

// Retrieves all student groups for the authorized institution, formatted hierarchical or flat
exports.getAllGroups = async (req, res) => {
  try {
    const institutionId = req.user.InstitutionId;

    const groups = await Group.findAll({
      where: { InstitutionId: institutionId },
      // CRITICAL FIX: Removed non-existent 'type' column from attributes reflection
      include: [{
        model: Group,
        as: 'Subgroups',
        attributes: ['id', 'name', 'studentCount', 'parentGroupId']
      }],
      order: [['course', 'ASC'], ['name', 'ASC']]
    });

    res.json(groups);
  } catch (error) {
    console.error('Get Groups Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching student groups.', error: error.message });
  }
};

// Updates student group metadata after verifying institution multi-tenancy ownership
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;
    const { name, studentCount, course, specialization, type, parentGroupId } = req.body;

    const group = await Group.findOne({ where: { id, InstitutionId: institutionId } });
    if (!group) {
      return res.status(404).json({ message: 'Student group not found or access denied.' });
    }

    const updateData = {};

    if (name) {
      const trimmedName = name.trim();
      if (trimmedName !== group.name) {
        // Guarantee new name doesn't collide with existing groups inside the same branch
        const nameCollision = await Group.findOne({ where: { name: trimmedName, InstitutionId: institutionId } });
        if (nameCollision) {
          return res.status(400).json({ message: `Cannot rename group: name "${trimmedName}" is already taken.` });
        }
        updateData.name = trimmedName;
      }
    }

    if (studentCount !== undefined) updateData.studentCount = parseInt(studentCount, 10);
    if (course !== undefined) updateData.course = parseInt(course, 10);
    if (specialization !== undefined) updateData.specialization = specialization ? specialization.trim() : null;
    if (type !== undefined) updateData.type = type;
    
    if (parentGroupId !== undefined) {
      if (parentGroupId && parentGroupId !== group.parentGroupId) {
        const parentGroup = await Group.findOne({ where: { id: parentGroupId, InstitutionId: institutionId } });
        if (!parentGroup) {
          return res.status(404).json({ message: 'Specified parent group context not found.' });
        }
      }
      updateData.parentGroupId = parentGroupId || null;
    }

    await group.update(updateData);
    res.json(group);
  } catch (error) {
    console.error('Update Group Error:', error.message);
    res.status(500).json({ message: 'Server error while updating student group.', error: error.message });
  }
};

// Deletes a student group only if it does not contain any active generated schedule associations
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.InstitutionId;

    const group = await Group.findOne({ 
      where: { id, InstitutionId: institutionId } 
    });

    if (!group) {
      return res.status(404).json({ message: 'Student group not found or access denied.' });
    }

    // Integrity constraint check: Prevents breaking active schedules
    const hasSchedule = await Schedule.findOne({ where: { GroupId: id } });
    if (hasSchedule) {
      return res.status(400).json({ 
        message: 'Cannot delete group: an active generated schedule structure is currently linked to this target context.' 
      });
    }

    // Subgroup safety constraint: Block deletion of a parent group if children elements remain active
    const hasChildrenSubgroups = await Group.findOne({ where: { parentGroupId: id } });
    if (hasChildrenSubgroups) {
      return res.status(400).json({
        message: 'Cannot delete parent group: please remove or dissociate its connected child subgroups first.'
      });
    }

    await group.destroy();
    res.json({ message: `Group "${group.name}" successfully deleted.` });
  } catch (error) {
    console.error('Delete Group Error:', error.message);
    res.status(500).json({ message: 'Server error while deleting student group.', error: error.message });
  }
};