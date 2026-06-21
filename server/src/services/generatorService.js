const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs').promises;
const { performance } = require('perf_hooks');

const { 
  Group, 
  Classroom, 
  TimeSettings, 
  Curriculum, 
  Schedule, 
  ScheduleVersion, 
  TeacherConstraint,
  BlockedSlot
} = require('../models');

/**
 * Appends performance metrics report to a txt file.
 */
async function logPerformanceMetrics(metrics) {
  const logPath = path.resolve(process.cwd(), 'generation_metrics.txt');
  const timestamp = new Date().toISOString();
  
  const logEntry = [
    `==================================================`,
    `TIMESTAMP:       ${timestamp}`,
    `INSTITUTION ID:  ${metrics.institutionId}`,
    `TOTAL VARIABLES: ${metrics.totalTasks} (Lesson Cards)`,
    `EXECUTION TIME:  ${metrics.durationSeconds} seconds`,
    `AVERAGE CPU:     ${metrics.cpuPercentage}%`,
    `PEAK RAM USAGE:  ${metrics.memoryUsedMB} MB`,
    `STATUS:          ${metrics.status.toUpperCase()}`,
    `==================================================\n\n`
  ].join('\n');

  try {
    await fs.appendFile(logPath, logEntry, 'utf8');
  } catch (error) {
    console.error(`[Performance Logger Error]: Failed to write metrics to file: ${error.message}`);
  }
}

exports.runInWorker = (versionId, institutionId) => {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve(__dirname, 'generatorWorker.js'); 
    const worker = new Worker(workerPath, {
      workerData: { versionId, institutionId }
    });

    worker.on('message', (message) => {
      if (message.success) resolve(message.data);
      else reject(new Error(message.error));
    });
    worker.on('error', (error) => reject(error));
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker thread stopped unexpectedly with exit code ${code}`));
    });
  });
};

/**
 * Two-Phase Hybrid CSP Cascade Engine
 */
exports.autoGenerate = async (versionId, institutionId) => {
  const startTime = performance.now();
  const startCPU = process.cpuUsage();
  const startMemory = process.memoryUsage().heapUsed;

  let totalTasksCount = 0;
  let finalRelaxationBuffer = 0;
  let currentPhaseStatus = 'failed';

  try {
    const version = await ScheduleVersion.findByPk(versionId);
    const timeSettings = await TimeSettings.findAll({
      where: { ScheduleVersionId: versionId },
      order: [['orderNumber', 'ASC']]
    });

    if (!version || timeSettings.length === 0) {
      throw new Error('Incomplete version configuration matrix or time slots missing');
    }

    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const activeDays = allDays.slice(0, version.daysPerWeek || 5);
    const activeSlots = timeSettings.map(s => String(s.orderNumber));
    
    const classrooms = await Classroom.findAll({ where: { InstitutionId: institutionId, isAvailable: true } });
    const curriculumTasks = await Curriculum.findAll({
      where: { ScheduleVersionId: versionId },
      include: [{ model: Group, where: { InstitutionId: institutionId } }]
    });

    let allConstraints = [];
    try { allConstraints = await TeacherConstraint.findAll({ where: { ScheduleVersionId: versionId } }); } catch (e) {
      try { allConstraints = await TeacherConstraint.findAll().catch(() => []); } catch (err) { allConstraints = []; }
    }

    let globalBlocks = [];
    try { globalBlocks = await BlockedSlot.findAll({ where: { ScheduleVersionId: versionId } }); } catch (e) {
      try { globalBlocks = await BlockedSlot.findAll().catch(() => []); } catch (err) { globalBlocks = []; }
    }

    const allGroups = await Group.findAll({
      where: { InstitutionId: institutionId },
      attributes: ['id', 'parentGroupId', 'studentCount']
    }).catch(() => []);

    const groupMap = {};
    const groupSizes = {};
    allGroups.forEach(g => {
      groupMap[g.id] = g.parentGroupId;
      groupSizes[g.id] = g.studentCount || 0;
    });

    const systemBlockedKeys = new Set();
    globalBlocks.forEach(b => { if (b.dayOfWeek) systemBlockedKeys.add(b.dayOfWeek); });

    const forbiddenTeacherSlots = new Set();
    allConstraints.forEach(c => { 
      if (c.TeacherId && c.dayOfWeek && c.timeSlot) {
        forbiddenTeacherSlots.add(`${c.TeacherId}-${c.dayOfWeek}-${c.timeSlot}`); 
      }
    });

    let flatTasks = [];
    const studentTotalLoad = {}; 

    for (const task of curriculumTasks) {
      const types = [
        { type: 'Lecture', pairs: task.lectureHours || 0 },
        { type: 'Laboratory', pairs: task.labHours || 0 },
        { type: 'Practice', pairs: task.practiceHours || 0 }
      ];

      for (const t of types) {
        for (let i = 0; i < t.pairs; i++) {
          flatTasks.push({
            type: t.type,
            GroupId: task.GroupId,
            SubjectId: task.SubjectId,
            TeacherId: task.TeacherId
          });

          const parentId = groupMap[task.GroupId];
          if (parentId) {
            studentTotalLoad[task.GroupId] = (studentTotalLoad[task.GroupId] || 0) + 1;
          } else {
            studentTotalLoad[task.GroupId] = (studentTotalLoad[task.GroupId] || 0) + 1;
            allGroups.forEach(g => {
              if (g.parentGroupId === task.GroupId) {
                studentTotalLoad[g.id] = (studentTotalLoad[g.id] || 0) + 1;
              }
            });
          }
        }
      }
    }

    totalTasksCount = flatTasks.length;

    if (flatTasks.length === 0) {
      throw new Error('Curriculum requirements are empty.');
    }

    const totalDaysCount = activeDays.filter(d => !systemBlockedKeys.has(d)).length || 5;
    const studentDailyCap = {};
    Object.keys(studentTotalLoad).forEach(gId => {
      studentDailyCap[gId] = Math.ceil(studentTotalLoad[gId] / totalDaysCount) + 1;
    });

    allGroups.forEach(parent => {
      if (!parent.parentGroupId) {
        let maxChildCap = studentDailyCap[parent.id] || 0;
        allGroups.forEach(child => {
          if (child.parentGroupId === parent.id) {
            if ((studentDailyCap[child.id] || 0) > maxChildCap) {
              maxChildCap = studentDailyCap[child.id];
            }
          }
        });
        if (maxChildCap > 0) studentDailyCap[parent.id] = maxChildCap;
      }
    });

    /**
              * MRV (Minimum Remaining Values) Heuristic: Sort tasks by teacher constraints 
     * to prioritize scheduling variables that are hardest to place.
     */
    flatTasks.sort((a, b) => {
      const getScore = (id) => {
        if (!id) return 100;
        const constraintsCount = allConstraints.filter(cons => cons.TeacherId === id).length;
        return constraintsCount > 0 ? (100 - constraintsCount) : 100;
      };
      return getScore(a.TeacherId) - getScore(b.TeacherId);
    });

    const shuffleArray = (array) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    /**
     * Room Cache Optimization & LCV (Least Constraining Value) Heuristic
     */
    const roomCacheRandom = {};
    const roomCacheDeterministic = {};
    
    flatTasks.forEach(task => {
      if (roomCacheRandom[task.type]) return;
      const neededCapacity = groupSizes[task.GroupId] || 0;
      let rooms = classrooms.filter(r => {
        if ((r.capacity || 0) < neededCapacity) return false;
        if (task.type === 'Lecture') return r.type === 'Lecture' || r.type === 'General';
        if (task.type === 'Laboratory') return r.type === 'Laboratory' || r.type === 'Computer Class';
        if (task.type === 'Practice') return r.type === 'General' || r.type === 'Lecture' || r.type === 'Computer Class';
        return true;
      });
      if (rooms.length === 0) rooms = classrooms.filter(r => (r.capacity || 0) >= neededCapacity);
      
      roomCacheRandom[task.type] = [...rooms];
      rooms.sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
      roomCacheDeterministic[task.type] = rooms;
    });

    let busyTeachers = {};
    let busyGroups = {};
    let busyClassrooms = {};
    let groupDailyLoadTracker = {}; 
    let finalScheduleProposals = [];
    
    let totalBacktracks = 0;
    let MAX_BACKTRACKS = 50000;

    function hasConflict(task, day, slot, roomId, relaxationBuffer) {
      const key = `${day}-${slot}`;
      if (task.TeacherId && busyTeachers[key]?.has(task.TeacherId)) return true;
      if (busyClassrooms[key]?.has(roomId)) return true;
      if (busyGroups[key]?.has(task.GroupId)) return true;

      const parentId = groupMap[task.GroupId];
      if (parentId && busyGroups[key]?.has(parentId)) return true;
      if (busyGroups[key]) {
        for (const bookedGroupId of busyGroups[key]) {
          if (groupMap[bookedGroupId] === task.GroupId) return true;
        }
      }

      const targetCap = (studentDailyCap[task.GroupId] || 4) + relaxationBuffer;
      const currentTargetLoad = groupDailyLoadTracker[`${task.GroupId}-${day}`] || 0;
      if (currentTargetLoad >= targetCap) return true;

      if (parentId) {
        const parentCap = (studentDailyCap[parentId] || 4) + relaxationBuffer;
        const currentParentLoad = groupDailyLoadTracker[`${parentId}-${day}`] || 0;
        if (currentParentLoad >= parentCap) return true;
      }
      return false;
    }

    function solve(index, relaxationBuffer, isDeterministic) {
      totalBacktracks++;
      if (totalBacktracks > MAX_BACKTRACKS) return false; 
      if (index === flatTasks.length) return true; 

      const task = flatTasks[index];
      const suitableRooms = isDeterministic ? (roomCacheDeterministic[task.type] || classrooms) : (roomCacheRandom[task.type] || classrooms);

      const daysOrder = isDeterministic ? activeDays : shuffleArray(activeDays);
      const slotsOrder = isDeterministic ? activeSlots : shuffleArray(activeSlots);

      for (const day of daysOrder) {
        if (systemBlockedKeys.has(day)) continue;

        for (const slot of slotsOrder) {
          const key = `${day}-${slot}`;

          if (task.TeacherId && busyTeachers[key]?.has(task.TeacherId)) continue;
          if (busyGroups[key]?.has(task.GroupId)) continue;
          if (task.TeacherId && forbiddenTeacherSlots.has(`${task.TeacherId}-${day}-${slot}`)) continue;

          for (const room of suitableRooms) {
            if (hasConflict(task, day, slot, room.id, relaxationBuffer)) continue;

            if (!busyTeachers[key]) busyTeachers[key] = new Set();
            if (!busyGroups[key]) busyGroups[key] = new Set();
            if (!busyClassrooms[key]) busyClassrooms[key] = new Set();

            if (task.TeacherId) busyTeachers[key].add(task.TeacherId);
            busyGroups[key].add(task.GroupId);
            busyClassrooms[key].add(room.id);
            
            groupDailyLoadTracker[`${task.GroupId}-${day}`] = (groupDailyLoadTracker[`${task.GroupId}-${day}`] || 0) + 1;
            const parentId = groupMap[task.GroupId];
            
            if (parentId) {
              groupDailyLoadTracker[`${parentId}-${day}`] = (groupDailyLoadTracker[`${parentId}-${day}`] || 0) + 1;
            } else {
              allGroups.forEach(g => {
                if (g.parentGroupId === task.GroupId) {
                  groupDailyLoadTracker[`${g.id}-${day}`] = (groupDailyLoadTracker[`${g.id}-${day}`] || 0) + 1;
                }
              });
            }

            const matchingSlotSetting = timeSettings.find(s => String(s.orderNumber) === slot);
            const timeSlotLabel = matchingSlotSetting 
              ? `${matchingSlotSetting.startTime.substring(0, 5)} - ${matchingSlotSetting.endTime.substring(0, 5)}`
              : `Slot #${slot}`;

            finalScheduleProposals.push({
              dayOfWeek: day, timeSlot: timeSlotLabel, type: task.type,
              GroupId: task.GroupId, SubjectId: task.SubjectId, TeacherId: task.TeacherId || null,
              ClassroomId: room.id, ScheduleVersionId: versionId, isOnline: false
            });

            if (solve(index + 1, relaxationBuffer, isDeterministic)) return true;

            // ROLLBACK
            if (task.TeacherId) busyTeachers[key].delete(task.TeacherId);
            busyGroups[key].delete(task.GroupId);
            busyClassrooms[key].delete(room.id);
            groupDailyLoadTracker[`${task.GroupId}-${day}`]--;
            if (parentId) groupDailyLoadTracker[`${parentId}-${day}`]--;
            else {
              allGroups.forEach(g => { if (g.parentGroupId === task.GroupId) groupDailyLoadTracker[`${g.id}-${day}`]--; });
            }
            finalScheduleProposals.pop();
          }
        }
      }
      return false;
    }

    console.log(`[Phase 1]: Launching fast randomized CSP...`);
    MAX_BACKTRACKS = 40000; 
    let success = false;

    for (let relaxationBuffer = 0; relaxationBuffer <= 4; relaxationBuffer++) {
      finalRelaxationBuffer = relaxationBuffer;
      totalBacktracks = 0; busyTeachers = {}; busyGroups = {}; busyClassrooms = {}; groupDailyLoadTracker = {}; finalScheduleProposals = [];

      if (solve(0, relaxationBuffer, false)) {
        success = true;
        currentPhaseStatus = 'success_phase_1_stochastic';
        console.log(`[Phase 1]: Success! Schedule generated via Stochastic CSP with buffer +${relaxationBuffer}`);
        break;
      }
    }

    /**
     * PHASE 2: Deterministic Backtracking CSP (Fallback if Stochastic phase fails)
     */
    if (!success) {
      console.log(`[Phase 1 -> Failed]: Stochastic engine failed. ACTIVATING PHASE 2 (Deterministic CSP)...`);
      MAX_BACKTRACKS = 200000; 

      for (let relaxationBuffer = 0; relaxationBuffer <= 4; relaxationBuffer++) {
        finalRelaxationBuffer = relaxationBuffer;
        totalBacktracks = 0; busyTeachers = {}; busyGroups = {}; busyClassrooms = {}; groupDailyLoadTracker = {}; finalScheduleProposals = [];

        if (solve(0, relaxationBuffer, true)) {
          success = true;
          currentPhaseStatus = 'success_phase_2_deterministic';
          console.log(`[Phase 2]: Success! Deterministic engine resolved tight matrix constraints with buffer +${relaxationBuffer}`);
          break;
        }
      }
    }

    if (!success) {
      throw new Error('Execution timeout due to tight constraint grid.');
    }

    await Schedule.destroy({ where: { ScheduleVersionId: versionId } });
    await Schedule.bulkCreate(finalScheduleProposals);

    const endTime = performance.now();
    await logPerformanceMetrics({
      institutionId, versionId, totalTasks: totalTasksCount,
      durationSeconds: ((endTime - startTime) / 1000).toFixed(3),
      cpuPercentage: (((process.cpuUsage(startCPU).user + process.cpuUsage(startCPU).system) / 1000) / (endTime - startTime) * 100).toFixed(1),
      memoryUsedMB: ((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024).toFixed(2),
      status: currentPhaseStatus
    });

    return { success: true, placedLessons: flatTasks.length, message: `Generated via ${currentPhaseStatus}` };

  } catch (error) {
    const endTime = performance.now();
    await logPerformanceMetrics({
      institutionId, versionId, totalTasks: totalTasksCount,
      durationSeconds: ((endTime - startTime) / 1000).toFixed(3),
      cpuPercentage: (((process.cpuUsage(startCPU).user + process.cpuUsage(startCPU).system) / 1000) / (endTime - startTime) * 100).toFixed(1),
      memoryUsedMB: ((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024).toFixed(2),
      status: `failed: ${error.message}`
    });
    return { success: false, placedLessons: 0, message: error.message };
  }
};