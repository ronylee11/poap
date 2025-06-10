const User = require('../models/User');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const isAdmin = await User.isAdmin(req.user.address);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
  } catch (error) {
    console.error('Admin role check error:', error);
    res.status(500).json({ message: 'Error checking admin role' });
  }
};

// Middleware to check if user is lecturer
const isLecturer = async (req, res, next) => {
  try {
    console.log('Checking lecturer role for:', req.user.address);
    const isLecturer = await User.isLecturer(req.user.address);
    console.log('Is lecturer:', isLecturer);
    if (!isLecturer) {
      return res.status(403).json({ message: 'Access denied. Lecturer role required.' });
    }
    next();
  } catch (error) {
    console.error('Lecturer role check error:', error);
    res.status(500).json({ message: 'Error checking lecturer role' });
  }
};

// Middleware to check if user is student
const isStudent = async (req, res, next) => {
  try {
    const isStudent = await User.isStudent(req.user.address);
    if (!isStudent) {
      return res.status(403).json({ message: 'Access denied. Student role required.' });
    }
    next();
  } catch (error) {
    console.error('Student role check error:', error);
    res.status(500).json({ message: 'Error checking student role' });
  }
};

// Middleware to check if user is admin or lecturer
const isAdminOrLecturer = async (req, res, next) => {
  try {
    const isAdmin = await User.isAdmin(req.user.address);
    const isLecturer = await User.isLecturer(req.user.address);
    if (!isAdmin && !isLecturer) {
      return res.status(403).json({ message: 'Access denied. Admin or Lecturer role required.' });
    }
    next();
  } catch (error) {
    console.error('Admin/Lecturer role check error:', error);
    res.status(500).json({ message: 'Error checking roles' });
  }
};

module.exports = {
  isAdmin,
  isLecturer,
  isStudent,
  isAdminOrLecturer
}; 