const Group = require('../models/Group');

exports.createGroup = async (req, res) => {
  try {
    const group = await Group.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при створенні групи', error: error.message });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при отриманні груп', error: error.message });
  }
};