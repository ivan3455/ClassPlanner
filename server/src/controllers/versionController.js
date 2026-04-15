const ScheduleVersion = require('../models/ScheduleVersion');
const Schedule = require('../models/Schedule');

// Створити нову порожню версію
exports.createVersion = async (req, res) => {
  try {
    const version = await ScheduleVersion.create(req.body);
    res.status(201).json(version);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при створенні версії', error: error.message });
  }
};

// Активувати версію (зробити її основною)
exports.activateVersion = async (req, res) => {
  try {
    const { id } = req.params;
    // Спочатку деактивуємо всі версії
    await ScheduleVersion.update({ isActive: false }, { where: {} });
    // Активуємо обрану
    await ScheduleVersion.update({ isActive: true }, { where: { id } });
    res.json({ message: 'Версію розкладу активовано як основну' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при активації', error: error.message });
  }
};

// Дублювання версії (для створення чернетки на основі існуючої)
exports.duplicateVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await ScheduleVersion.findByPk(id);
    const entries = await Schedule.findAll({ where: { ScheduleVersionId: id } });

    const copy = await ScheduleVersion.create({
      name: `${original.name} (Копія)`,
      isActive: false
    });

    const newEntries = entries.map(e => ({
      ...e.dataValues,
      id: undefined, // Sequelize згенерує нові UUID
      ScheduleVersionId: copy.id
    }));

    await Schedule.bulkCreate(newEntries);
    res.status(201).json({ message: 'Версію успішно здубльовано', newVersion: copy });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при дублюванні', error: error.message });
  }
};