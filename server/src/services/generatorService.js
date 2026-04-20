const Curriculum = require('../models/Curriculum');
const Schedule = require('../models/Schedule');
const Classroom = require('../models/Classroom');
const scheduleService = require('./scheduleService');

exports.autoGenerate = async (versionId) => {
  // 1. Отримуємо весь навчальний план
  const tasks = await Curriculum.findAll();
  const classrooms = await Classroom.findAll();
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = ['08:30 - 10:00', '10:30 - 12:00', '12:30 - 14:00', '14:30 - 16:00'];
  
  let createdCount = 0;
  let errors = [];

  for (const task of tasks) {
    // Розбиваємо години на типи занять (пара = 2 години)
    const assignments = [
      { type: 'Lecture', count: task.lectureHours / 2 },
      { type: 'Laboratory', count: task.labHours / 2 },
      { type: 'Practice', count: task.practiceHours / 2 }
    ];

    for (const assign of assignments) {
      for (let i = 0; i < assign.count; i++) {
        let placed = false;

        // Шукаємо вільне місце
        searchLoop: 
        for (const day of days) {
          for (const slot of slots) {
            // Фільтруємо аудиторії за типом заняття
            const suitableRooms = classrooms.filter(r => r.type === assign.type || r.type === 'General');

            for (const room of suitableRooms) {
              const proposal = {
                dayOfWeek: day,
                timeSlot: slot,
                type: assign.type,
                GroupId: task.GroupId,
                SubjectId: task.SubjectId,
                TeacherId: task.TeacherId,
                ClassroomId: room.id,
                ScheduleVersionId: versionId,
                isOnline: false
              };

              // Використовуємо твій готовий валідатор!
              const conflict = await scheduleService.checkConflicts(proposal);

              if (!conflict) {
                await Schedule.create(proposal);
                placed = true;
                createdCount++;
                break searchLoop; // Знайшли місце, переходимо до наступної пари
              }
            }
          }
        }
        if (!placed) {
          errors.push(`Не вдалося знайти місце для: ${assign.type} (Предмет ID: ${task.SubjectId})`);
        }
      }
    }
  }

  return { createdCount, errors };
};