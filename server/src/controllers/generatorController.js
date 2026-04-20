const generatorService = require('../services/generatorService');

exports.generate = async (req, res) => {
  try {
    const { versionId } = req.body;
    if (!versionId) return res.status(400).json({ message: "Необхідно вказати ID версії" });

    const result = await generatorService.autoGenerate(versionId);
    res.json({
      message: "Генерація завершена",
      count: result.createdCount,
      issues: result.errors
    });
  } catch (error) {
    res.status(500).json({ message: "Помилка генерації", error: error.message });
  }
};