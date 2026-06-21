const { Schedule, BlockedSlot, TeacherConstraint, Group } = require('../models');
const { Op } = require('sequelize');

/**
 * Validates schedule parameters against hard constraints (overlapping time slots, teacher availability, institutional blocks).
 */
const checkConflicts = async (data, currentEntryId = null) => {
  const { dayOfWeek, timeSlot, ClassroomId, TeacherId, GroupId, ScheduleVersionId, date } = data;

  if (!ScheduleVersionId) {
    throw new Error('System error: ScheduleVersionId contextual binding is required for conflict validation routines.');
  }

  const targetId = currentEntryId || data.id;

  // 1. STRUCTURAL LAYER VERIFICATION
  const isBlocked = await BlockedSlot.findOne({
    where: {
      ScheduleVersionId,
      [Op.or]: [
        { dayOfWeek: dayOfWeek },
        ...(date ? [{ specificDate: date }] : [])
      ]
    }
  });

  if (isBlocked) {
    return `Time slot unavailable: ${isBlocked.reason || 'Technical operational hold active.'}`;
  }

  // 2. VARIABLE OPERATIONAL CONSTRAINTS: Teacher availability windows
  // ФІКС ОКОЛОМАТЕМАТИЧНОГО ПЕРЕТИНУ ІНТЕРВАЛІВ (Часткове накладання типу 09:00 - 10:00)
  if (TeacherId && timeSlot && timeSlot.includes('-')) {
    const [slotStart, slotEnd] = timeSlot.split('-').map(t => t.trim());

    // Формула перетину: (Обмеження.Початок < Пара.Кінець) ТА (Обмеження.Кінець > Пара.Початок)
    const teacherConstraint = await TeacherConstraint.findOne({
      where: {
        TeacherId,
        dayOfWeek,
        startTime: { [Op.lt]: slotEnd },
        endTime: { [Op.gt]: slotStart }
      }
    });

    if (teacherConstraint) {
      return `The assigned teacher has a scheduling window conflict or explicit preferred block during slot "${timeSlot}" (Blocked: ${teacherConstraint.startTime} - ${teacherConstraint.endTime}).`;
    }
  }

  // 3. PHYSICAL ALLOCATION LAYER: Resource overlapping checks
  const targetGroup = await Group.findOne({ where: { id: GroupId } });
  if (!targetGroup) {
    return 'Target academic student group context not found.';
  }

  const relatedGroupIds = [GroupId];
  if (targetGroup.parentGroupId) {
    relatedGroupIds.push(targetGroup.parentGroupId);
  }
  
  const subGroups = await Group.findAll({ where: { parentGroupId: GroupId }, attributes: ['id'] });
  if (subGroups.length > 0) {
    subGroups.forEach(sg => relatedGroupIds.push(sg.id));
  }

  const conflictFilter = {
    dayOfWeek,
    timeSlot: timeSlot.trim(),
    ScheduleVersionId,
    [Op.or]: [
      { ClassroomId },
      { TeacherId },
      { GroupId: { [Op.in]: relatedGroupIds } } 
    ]
  };

  if (targetId) {
    conflictFilter.id = { [Op.ne]: targetId };
  }

  const conflict = await Schedule.findOne({
    where: conflictFilter,
    include: [{ model: Group, attributes: ['id', 'name', 'parentGroupId'] }]
  });

  if (conflict) {
    if (conflict.ClassroomId === ClassroomId) {
      return `The targeted classroom/cabinet is already fully occupied during slot "${timeSlot}".`;
    }
    if (conflict.TeacherId === TeacherId) {
      return `The assigned teacher is already occupied with another academic class during slot "${timeSlot}".`;
    }
    if (relatedGroupIds.includes(conflict.GroupId)) {
      if (conflict.GroupId === GroupId) {
        return `The designated student group is already assigned to a parallel lesson instance during slot "${timeSlot}".`;
      } else {
        return `Conflict via structural division: An overlapping lesson exists for a connected sub-branch or parent class (${conflict.Group ? conflict.Group.name : 'Subgroup'}) during slot "${timeSlot}".`;
      }
    }
  }

  return null; 
};

module.exports = {
  checkConflicts
};