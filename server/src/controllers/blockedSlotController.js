const BlockedSlot = require('../models/BlockedSlot');

exports.blockSlot = async (req, res) => {
  try {
    const slot = await BlockedSlot.create(req.body);
    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при блокуванні', error: error.message });
  }
};