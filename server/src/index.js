require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Система планування розкладу працює!');
});

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});