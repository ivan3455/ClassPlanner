// Ensure the path correctly points to your models folder based on this file's physical location
const { sequelize } = require('./src/models'); 

async function resetDatabase() {
  try {
    console.log('⏳ Initialization of full database wipe sequence...');
    
    // CRITICAL: force: true hard-drops all existing tables and replicates them cleanly from scratch
    await sequelize.sync({ force: true });
    
    console.log('🚀 DATABASE SUCCESSFULLY WIPED AND RE-CREATED WITH CLEAN SCHEMAS!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Critical error during database sync destruction phase:', error.message);
    process.exit(1);
  }
}

resetDatabase();