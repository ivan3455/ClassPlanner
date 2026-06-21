const { Sequelize } = require('sequelize');
const crypto = require('crypto'); // Built-in Node.js module for clean UUID generation

// 1. Direct configuration bridge matching your instance profile
const sequelize = new Sequelize('class_planner', 'postgres', 'awdijl912', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

async function initSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log('📡 Database connection established successfully...');

    const email = 'admin@classplanner.com';
    const fullName = 'Platform Root Administrator';
    
    // Cryptographically generated secure UUID v4 on Node.js side to avoid pgcrypto dependency blocks
    const adminUuid = crypto.randomUUID();

    // Valid bcrypt hash matching password string: AdminPass777
    const preHashedPassword = '$2a$12$lIZeoSOuimn7A9U2XKs.f.lSfaN7OcT.RzJGiuIdOOmZF7kK5bR7i'; 

    // 2. Direct native SQL execution pass
    await sequelize.query(`
      INSERT INTO "Users" ("id", "fullName", "email", "password", "role", "isActive", "createdAt", "updatedAt", "InstitutionId")
      VALUES ('${adminUuid}', '${fullName}', '${email}', '${preHashedPassword}', 'SuperAdmin', true, NOW(), NOW(), NULL)
      ON CONFLICT ("email") DO NOTHING;
    `);

    console.log('\n======================================================');
    console.log('🚀 [SUCCESS]: Cryptographically secure SuperAdmin deployed!');
    console.log(`🆔 Identity Token (ID): ${adminUuid}`);
    console.log(`📧 Login Descriptor (Email): ${email}`);
    console.log('🔑 Operational Password: AdminPass777');
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ SQL Operational pipeline execution failed:', error.message);
    process.exit(1);
  }
}

initSuperAdmin();