const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const { isLecturer } = require('../middleware/roleMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply verifyToken middleware to all routes
router.use(verifyToken);
router.use(isLecturer);

// Create new class
router.post('/classes',
  [
    body('name').notEmpty().withMessage('Class name is required'),
    body('description').optional().isString(),
    body('schedule').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, schedule } = req.body;
      const lecturerAddress = req.user.address;

      const newClass = new Class({
        name,
        description,
        schedule,
        lecturer: lecturerAddress
      });

      await newClass.save();
      res.status(201).json({ message: 'Class created successfully', class: newClass });
    } catch (error) {
      res.status(500).json({ message: 'Error creating class' });
    }
  }
);

// Update class details
router.put('/classes/:classId',
  [
    body('name').optional().notEmpty().withMessage('Class name cannot be empty'),
    body('description').optional().isString(),
    body('schedule').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { classId } = req.params;
      const { name, description, schedule } = req.body;

      const classDoc = await Class.findOne({ _id: classId, lecturer: req.user.address });
      if (!classDoc) {
        return res.status(404).json({ message: 'Class not found' });
      }

      if (name) classDoc.name = name;
      if (description) classDoc.description = description;
      if (schedule) classDoc.schedule = schedule;

      await classDoc.save();
      res.json({ message: 'Class updated successfully', class: classDoc });
    } catch (error) {
      res.status(500).json({ message: 'Error updating class' });
    }
  }
);

// Delete class
router.delete('/classes/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findOneAndDelete({ _id: classId, lecturer: req.user.address });
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting class' });
  }
});

// Enroll student in class
router.post('/classes/:classId/enroll',
  [
    body('studentAddress').isEthereumAddress().withMessage('Invalid student address')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { classId } = req.params;
      const { studentAddress } = req.body;

      // Check if student exists
      const student = await User.findOne({ address: studentAddress, role: 'student' });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const classDoc = await Class.findOne({ _id: classId, lecturer: req.user.address });
      if (!classDoc) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Check if student is already enrolled
      if (classDoc.students.includes(studentAddress)) {
        return res.status(400).json({ message: 'Student already enrolled' });
      }

      classDoc.students.push(studentAddress);
      await classDoc.save();

      res.json({ message: 'Student enrolled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error enrolling student' });
    }
  }
);

// Remove student from class
router.delete('/classes/:classId/students/:address', async (req, res) => {
  try {
    const { classId, address } = req.params;

    const classDoc = await Class.findOne({ _id: classId, lecturer: req.user.address });
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    classDoc.students = classDoc.students.filter(student => student !== address);
    await classDoc.save();

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing student' });
  }
});

// Update student details in class
router.put('/classes/:classId/students/:address',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('studentId').optional().isString().withMessage('Invalid student ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { classId, address } = req.params;
      const { name, studentId } = req.body;

      const classDoc = await Class.findOne({ _id: classId, lecturer: req.user.address });
      if (!classDoc) {
        return res.status(404).json({ message: 'Class not found' });
      }

      if (!classDoc.students.includes(address)) {
        return res.status(404).json({ message: 'Student not enrolled in this class' });
      }

      const student = await User.findOne({ address, role: 'student' });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      if (name) student.name = name;
      if (studentId) student.studentId = studentId;

      await student.save();
      res.json({ message: 'Student details updated successfully', student });
    } catch (error) {
      res.status(500).json({ message: 'Error updating student details' });
    }
  }
);

// Validate attendance and mint NFT
router.post('/classes/:classId/attendance/validate',
  [
    body('studentAddress').isEthereumAddress().withMessage('Invalid student address'),
    body('date').isISO8601().withMessage('Invalid date format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { classId } = req.params;
      const { studentAddress, date } = req.body;

      const classDoc = await Class.findOne({ _id: classId, lecturer: req.user.address });
      if (!classDoc) {
        return res.status(404).json({ message: 'Class not found' });
      }

      if (!classDoc.students.includes(studentAddress)) {
        return res.status(404).json({ message: 'Student not enrolled in this class' });
      }

      // TODO: Implement NFT minting logic here
      // For now, just record the attendance
      const attendance = {
        student: studentAddress,
        date: new Date(date),
        validated: true,
        validatedBy: req.user.address
      };

      classDoc.attendance.push(attendance);
      await classDoc.save();

      res.json({ message: 'Attendance validated successfully', attendance });
    } catch (error) {
      res.status(500).json({ message: 'Error validating attendance' });
    }
  }
);

module.exports = router; 