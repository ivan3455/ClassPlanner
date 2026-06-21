// controllers/teacherLeaveController.js
const { TeacherRequest, User } = require('../models');

// Creates a new request (DayOff, Substitution, Reschedule) from a Teacher
const createRequest = async (req, res) => {
  try {
    const teacherId = req.user.id; // Get verified teacher UUID from token
    const { requestType, details } = req.body;

    if (!requestType || !details) {
      return res.status(400).json({ message: 'Missing required fields: requestType and details are mandatory.' });
    }

    const newRequest = await TeacherRequest.create({
      teacherId,
      requestType,
      details,
      status: 'Pending'
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create Teacher Request Error:', error.message);
    res.status(500).json({ message: 'Server error while submitting your request.', error: error.message });
  }
};

// Fetches all personal requests submitted by the logged-in Teacher
const getMyRequests = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // ФІКС КРАШУ: Викликаємо правильну модель TeacherRequest
    const requests = await TeacherRequest.findAll({
      where: { teacherId },
      order: [['createdAt', 'DESC']]
    });

    res.json(requests);
  } catch (error) {
    console.error('Get My Requests Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching personal request ledger.' });
  }
};

module.exports = {
  createRequest,
  getMyRequests
};