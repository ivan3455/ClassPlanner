const ExcelJS = require('exceljs');
const Schedule = require('../models/Schedule');
const Group = require('../models/Group');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

exports.exportToExcel = async (versionId) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Розклад');

  const schedules = await Schedule.findAll({
    where: { ScheduleVersionId: versionId },
    include: [
      { model: Group },
      { model: Subject },
      { model: Classroom },
      { model: User, as: 'Teacher' } // Використовуємо твій аліас
    ]
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = ['08:30 - 10:00', '10:30 - 12:00', '12:30 - 14:00', '14:30 - 16:00'];

  worksheet.getRow(1).values = ['', ...days];
  worksheet.getRow(1).font = { bold: true };

  slots.forEach((slot, index) => {
    const rowNumber = index + 2;
    const rowValues = [slot];

    days.forEach(day => {
      const entry = schedules.find(s => s.dayOfWeek === day && s.timeSlot === slot);
      
      if (entry) {
        // Використовуємо опціональний ланцюжок ?. щоб уникнути помилок undefined
        const subjectName = entry.Subject?.name || 'Предмет не вказано';
        const teacherName = entry.Teacher?.fullName || 'Викладач не вказаний';
        const roomNumber = entry.Classroom?.number || '??';

        rowValues.push(`${subjectName}\n${teacherName}\nАуд: ${roomNumber}`);
      } else {
        rowValues.push('');
      }
    });

    const row = worksheet.addRow(rowValues);
    row.height = 65; 
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  worksheet.columns.forEach(column => {
    column.width = 28;
  });

  return workbook;
};