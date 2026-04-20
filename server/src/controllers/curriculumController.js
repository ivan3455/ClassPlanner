const Curriculum = require('../models/Curriculum');
const Group = require('../models/Group');
const Subject = require('../models/Subject');
const User = require('../models/User');

exports.createCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.create(req.body);
    res.status(201).json(curriculum);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при створенні навчального плану', error: error.message });
  }
};

exports.getGroupCurriculum = async (req, res) => {
  try {
    const { groupId } = req.params;
    const plan = await Curriculum.findAll({
      where: { GroupId: groupId },
      include: [
        { model: Subject, attributes: ['name', 'code'] },
        { model: User, as: 'RecommendedTeacher', attributes: ['fullName'] }
      ]
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при отриманні плану', error: error.message });
  }
};

exports.getAllCurriculums = async (req, res) => {
  try {
    const curriculums = await Curriculum.findAll({
      include: [Group, Subject]
    });
    res.json(curriculums);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при отриманні всіх планів', error: error.message });
  }
};