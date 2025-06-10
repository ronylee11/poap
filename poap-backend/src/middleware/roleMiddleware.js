const User = require('../models/User');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.isAdmin(req.user.address);
    if (!user) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin role' });
  }
};

// Middleware to check if user is lecturer
const isLecturer = async (req, res, next) => {
  try {
    const user = await User.isLecturer(req.user.address);
    if (!user) {
      return res.status(403).json({ message: 'Access denied. Lecturer role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking lecturer role' });
  }
};

// Middleware to check if user is student
const isStudent = async (req, res, next) => {
  try {
    const user = await User.isStudent(req.user.address);
    if (!user) {
      return res.status(403).json({ message: 'Access denied. Student role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking student role' });
  }
};

// Middleware to check if user is admin or lecturer
const isAdminOrLecturer = async (req, res, next) => {
  try {
    const user = await User.findOne({ address: req.user.address });
    if (!user || (user.role !== 'admin' && user.role !== 'lecturer')) {
      return res.status(403).json({ message: 'Access denied. Admin or Lecturer role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking role' });
  }
};

module.exports = {
  isAdmin,
  isLecturer,
  isStudent,
  isAdminOrLecturer
}; 