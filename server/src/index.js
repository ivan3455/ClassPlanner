require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB, sequelize } = require('./config/db');
const User = require('./models/User'); // Імпортуємо модель, щоб Sequelize її побачив
const Subject = require('./models/Subject');
const Classroom = require('./models/Classroom');
const Group = require('./models/Group');
const Schedule = require('./models/Schedule');
const ScheduleVersion = require('./models/ScheduleVersion');

Schedule.belongsTo(ScheduleVersion);
ScheduleVersion.hasMany(Schedule, { onDelete: 'CASCADE' });

// Налаштування зв'язків
// 1. Запис розкладу належить групі
Schedule.belongsTo(Group);
Group.hasMany(Schedule);

// 2. Запис розкладу належить предмету
Schedule.belongsTo(Subject);
Subject.hasMany(Schedule);

// 3. Запис розкладу належить аудиторії
Schedule.belongsTo(Classroom);
Classroom.hasMany(Schedule);

// 4. Запис розкладу належить викладачу (User з роллю Teacher)
Schedule.belongsTo(User, { as: 'Teacher', foreignKey: 'TeacherId' });
User.hasMany(Schedule, { foreignKey: 'TeacherId' });

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const groupRoutes = require('./routes/groupRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const versionRoutes = require('./routes/versionRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/versions', versionRoutes);

connectDB();

app.get('/', (req, res) => {
  res.send('Система планування розкладу працює!');
});

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});

const startServer = async () => {
  try {
    // Підключення до БД
    await connectDB();

    // Синхронізація моделей з БД
    // { alter: true } оновить таблицю, якщо ти додаси нові поля пізніше
    await sequelize.sync({ alter: true });
    console.log('✅ Таблиці в базі даних синхронізовано.');

    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущено на порту ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Помилка при запуску сервера:', error);
  }
};

startServer();