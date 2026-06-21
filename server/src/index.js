require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron'); // CRITICAL WORKER DEPENDENCY INJECTED

const { connectDB } = require('./config/db');
const db = require('./models');
const superAdminController = require('./controllers/superAdminController'); // Import controller context safely

const app = express();
const PORT = process.env.PORT || 5000;

// --- GLOBAL MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- ROUTES CONFIGURATION ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/superadmin', require('./routes/superAdminRoutes'));
app.use('/api/methodist', require('./routes/methodistRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/curriculum', require('./routes/curriculumRoutes'));
app.use('/api/versions', require('./routes/versionRoutes'));
app.use('/api/time-settings', require('./routes/timeSettingsRoutes'));
app.use('/api/blocked-slots', require('./routes/blockedSlotRoutes'));
app.use('/api/teacher-constraints', require('./routes/teacherConstraintRoutes'));
app.use('/api/generator', require('./routes/generatorRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));

// Base Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Schedule Optimization System API is running...');
});

// --- GLOBAL ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ message: 'Internal server error occurred', error: err.message });
});

// --- CRON WORKER AUTOMATION MATRIX ---
// Task schedule string: '0 * * * *' executes precisely at minute 0 of every single hour
cron.schedule('0 * * * *', async () => {
  console.log('[Automated Task Framework]: Initiating scheduled check for expired multi-tenant resources...');
  await superAdminController.purgeExpiredInstitutions();
});

// --- SERVER INITIALIZATION ---
const startServer = async () => {
  try {
    // 1. Establish database connection link
    await connectDB();

    // 2. Database schema synchronization
    const syncOptions = process.env.NODE_ENV === 'production' ? {} : { alter: true };
    await db.sequelize.sync(syncOptions);
    console.log('Database synchronized successfully with multi-tenant layers.');

    // 3. Fire up the Express HTTP engine
    app.listen(PORT, () => {
      console.log(`Express HTTP server successfully running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    console.error('Critical error during server startup sequence:', error);
    process.exit(1);
  }
};

startServer();