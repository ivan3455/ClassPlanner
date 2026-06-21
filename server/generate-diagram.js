const fs = require('fs');
const path = require('path');
// Імпортуємо всі моделі з твого index.js
const models = require('./src/models/index.js'); 

function generateMermaidClassDiagram() {
  let diagram = 'classDiagram\n';
  
  // 1. Збираємо всі класи та їхні атрибути
  Object.keys(models).forEach(modelName => {
    // Пропускаємо саму інстанцію sequelize, залишаємо тільки моделі
    if (modelName === 'sequelize' || modelName === 'Sequelize') return;
    
    const model = models[modelName];
    if (!model.rawAttributes) return;

    diagram += `    class ${modelName} {\n`;
    
    // Перебираємо всі поля моделі
    Object.keys(model.rawAttributes).forEach(attrName => {
      const attr = model.rawAttributes[attrName];
      // Отримуємо тип даних (наприклад, UUID, STRING, ENUM)
      let typeName = attr.type.constructor.name;
      if (typeName === 'ENUM') typeName = 'ENUM';
      
      // Додаємо поле у форматі UML: + ім'я : тип
      diagram += `        +${attrName} : ${typeName}\n`;
    });
    
    diagram += '    }\n';
  });

  // 2. Збираємо зв'язки, які ти прописав у index.js
  // Оскільки ми маємо монолітну діаграму, відобразимо логічні реляції
  const associations = [
    'Institution "1" --* "*" User : hasMany',
    'Institution "1" --* "*" Group : hasMany',
    'Institution "1" --* "*" Classroom : hasMany',
    'Institution "1" --* "*" ScheduleVersion : hasMany',
    'Institution "1" --* "*" Subject : hasMany',
    'User "1" --* "0..1" Teacher : hasOne',
    'User "1" --* "*" TeacherRequest : hasMany',
    'ScheduleVersion "1" --* "*" Schedule : hasMany',
    'ScheduleVersion "1" --* "*" TimeSettings : hasMany',
    'ScheduleVersion "1" --* "*" BlockedSlot : hasMany',
    'Schedule "*" --> "1" Group : belongsTo',
    'Schedule "*" --> "1" Subject : belongsTo',
    'Schedule "*" --> "1" Classroom : belongsTo',
    'Schedule "*" --> "1" User : TeacherId',
    'User "1" --* "*" TeacherConstraint : hasMany',
    'Group "1" --> "0..1" Group : ParentGroup',
    'Group "1" --* "*" Curriculum : hasMany',
    'Subject "1" --* "*" Curriculum : hasMany',
    'Curriculum "*" --> "0..1" User : RecommendedTeacher'
  ];

  // Додаємо зв'язки до коду діаграми
  associations.forEach(assoc => {
    diagram += `    ${assoc}\n`;
  });

  // 3. Додаємо класи контролерів бізнес-логіки та їхні залежності (Dependency)
  diagram += `
    class SuperAdminController {
        +createInstitutionWithMethodist(req, res)
        +getAllInstitutions(req, res)
        +updateInstitutionData(req, res)
        +addMethodistToInstitution(req, res)
        +updateMethodistUser(req, res)
        +deleteInstitution(req, res)
        +restoreInstitution(req, res)
        +deleteMethodist(req, res)
        +purgeExpiredInstitutions()
    }
    class ScheduleController {
        +getScheduleView(req, res)
        +createScheduleEntry(req, res)
        +replaceTeacher(req, res)
        +updateScheduleEntry(req, res)
        +downloadExcel(req, res)
        +clearVersionSchedule(req, res)
    }

    SuperAdminController ..> Institution : dependency
    SuperAdminController ..> User : dependency
    ScheduleController ..> Schedule : dependency
    ScheduleController ..> ScheduleVersion : dependency
  `;

  // Записуємо готовий результат у файл
  const outputPath = path.join(__dirname, 'UML_Class_Diagram.md');
  fs.writeFileSync(outputPath, diagram);
  
  console.log(`\n👍 Успіх! Текстовий код UML-діаграми збережено у файл:\n${outputPath}`);
  console.log('Тепер ти можеш візуалізувати цей код у картинку.');
}

generateMermaidClassDiagram();