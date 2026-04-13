const { Sequelize } = require('sequelize');
require('dotenv').config();

// Налаштування підключення
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false, 
  }
);

// Функція для перевірки зв'язку
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL підключено успішно через Sequelize.');
  } catch (error) {
    console.error('❌ Неможливо підключитися до бази даних:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };