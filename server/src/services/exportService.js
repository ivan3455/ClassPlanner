const ExcelJS = require('exceljs');
const { Schedule, Group, Subject, Classroom, User, TimeSettings, ScheduleVersion } = require('../models');

// Переклад назв днів тижня для красивого відображення в шапці Excel
const daysTranslation = {
  'Monday': 'Понеділок', 'Tuesday': 'Вівторок', 'Wednesday': 'Середа',
  'Thursday': 'Четвер', 'Friday': 'П’ятниця', 'Saturday': 'Субота', 'Sunday': 'Неділя'
};

/**
 * Generates a highly stylized and dynamic multi-sheet Excel compilation of the generated schedule.
 * Creates an individual, customized spreadsheet matrix for each group based on version parameters.
 * @param {String} versionId - UUID of the target schedule version context
 */
exports.exportToExcel = async (versionId) => {
  const workbook = new ExcelJS.Workbook();

  // 1. Fetch live structure metadata to bypass hardcoded limitations
  const version = await ScheduleVersion.findByPk(versionId);
  if (!version) {
    throw new Error('Target schedule version not found');
  }

  const timeSettings = await TimeSettings.findAll({
    where: { ScheduleVersionId: versionId },
    order: [['orderNumber', 'ASC']]
  });

  if (timeSettings.length === 0) {
    throw new Error('Cannot export schedule: Time rings/slots are not configured for this version');
  }

  // Generate dynamic runtime boundaries based on configuration matrices
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const activeDays = allDays.slice(0, version.daysPerWeek || 5);
  const activeSlots = timeSettings.map(s => `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`);

const schedules = await Schedule.findAll({
    where: { ScheduleVersionId: versionId },
    include: [
      { model: Group, attributes: ['id', 'name'] },
      { model: Subject, attributes: ['id', 'name', 'code'] },
      { model: Classroom, attributes: ['id', 'number', 'building'] },
      { model: User, as: 'Teacher', attributes: ['id', 'fullName'] }
    ]
  });

  // Extract only groups that actually have scheduled rows assigned
  const uniqueGroups = [...new Set(schedules.map(s => s.Group?.name).filter(Boolean))].sort();

  // Handle empty schedule gracefully
  if (uniqueGroups.length === 0) {
    const fallbackSheet = workbook.addWorksheet('Порожній розклад');
    fallbackSheet.getCell('A1').value = 'Немає згенерованих даних розкладу для експорту.';
    return workbook;
  }

  // 3. Iterate over each unique group to generate isolated schedule sheets
  uniqueGroups.forEach(groupName => {
    // Sanitizes sheet name to fit within Excel's 31-character limit restriction
    const safeSheetName = groupName.replace(/[/\\?*:[\]]/g, '').substring(0, 31);
    const worksheet = workbook.addWorksheet(safeSheetName);

    // Style and apply clean document title header block
    worksheet.mergeCells(1, 1, 1, activeDays.length + 1);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `РОЗКЛАД ЗАНЯТЬ — ГРУПА: ${groupName.toUpperCase()}`;
    titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }; // Dark corporate blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 35;

    // Build timeline column matrix headers
    const headers = ['Час / Пара', ...activeDays.map(d => daysTranslation[d] || d)];
    const headerRowNumber = 2;
    worksheet.getRow(headerRowNumber).values = headers;
    
    // ФІКС 1: Виклик функції стилізації шапки винесено окремо, без закручування в getRow
    headerHeaderRowStyle(worksheet, headerRowNumber, activeDays.length);

    // Filter items tied specifically to this loop iteration scope
    const groupSchedules = schedules.filter(s => s.Group?.name === groupName);

    // 4. Fill matrix cell rows based on dynamic configuration steps
    activeSlots.forEach((slot, slotIndex) => {
      const currentRowNumber = slotIndex + 3;
      const rowValues = [slot];

      activeDays.forEach(day => {
        const entry = groupSchedules.find(s => 
          s.dayOfWeek === day && 
          s.timeSlot.replace(/\s+/g, '') === slot.replace(/\s+/g, '')
        );

        if (entry) {
          const subjectName = entry.Subject?.name || 'Навчальна дисципліна';
          const teacherName = entry.Teacher?.fullName || 'Викладач не вказаний';
          const roomNumber = entry.Classroom?.number ? `Ауд. ${entry.Classroom.number}` : '—';
          
          let typeLabel = '';
          if (entry.type === 'Lecture') typeLabel = '(Лекція)';
          if (entry.type === 'Practice') typeLabel = '(Практика)';
          if (entry.type === 'Laboratory') typeLabel = '(Лаб. робота)';

          rowValues.push(`${subjectName} ${typeLabel}\n${teacherName}\n${roomNumber}`);
        } else {
          rowValues.push(''); // Keep cell clean if no lesson exists
        }
      });

      worksheet.addRow(rowValues);
      
      // Dynamic presentation configuration adjustments per data row
      const currentRow = worksheet.getRow(currentRowNumber);
      currentRow.height = 55;
      currentRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      currentRow.font = { name: 'Arial', size: 9, font: 'medium' };
      
      // Apply alternate row striping for visual clarity
      if (slotIndex % 2 === 1) {
        for (let col = 1; col <= activeDays.length + 1; col++) {
          currentRow.getCell(col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' } // Сучасний ледь замітний сірий колір
          };
        }
      }

      // Add clean borders around all grid intersections
      for (let col = 1; col <= activeDays.length + 1; col++) {
        currentRow.getCell(col).border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      }
    });

    // Set professional, wide dimensions for grid content layout
    worksheet.getColumn(1).width = 16; // Time slot column width
    for (let c = 2; c <= activeDays.length + 1; c++) {
      worksheet.getColumn(c).width = 28; // Day column width
    }
  });

  return workbook;
};

// Isolated helper structure to style the table sub-header block cleanly
function headerHeaderRowStyle(worksheet, rowNumber, columnsCount) {
  const row = worksheet.getRow(rowNumber);
  row.height = 25;
  for (let c = 1; c <= columnsCount + 1; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF374151' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF2FF' } }; // Light corporate soft blue
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF1F4E78' } },
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };
  }
}