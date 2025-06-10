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

// Get all classes for the lecturer
router.get('/classes', async (req, res) => {
    try {
        console.log('Fetching classes for lecturer:', req.user.address);
        const classes = await Class.find({ lecturer: req.user.address });
        console.log('Found classes:', classes);
        res.json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ message: 'Failed to fetch classes' });
    }
});

// Create a new class
router.post('/classes', [
    body('classId').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('description').isString(),
    body('schedule').isString(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { classId, name, description, schedule, startDate, endDate } = req.body;

        // Check if classId already exists
        const existingClass = await Class.findOne({ classId });
        if (existingClass) {
            return res.status(400).json({ message: 'Class ID already exists' });
        }

        const newClass = new Class({
            classId,
            name,
            description,
            schedule,
            startDate,
            endDate,
            lecturer: req.user.address
        });

        await newClass.save();
        res.status(201).json(newClass);
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ message: 'Failed to create class' });
    }
});

// Update a class
router.put('/classes/:classId', [
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('schedule').optional().isString(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { classId } = req.params;
        const updates = req.body;

        const classToUpdate = await Class.findOne({ 
            classId,
            lecturer: req.user.address 
        });

        if (!classToUpdate) {
            return res.status(404).json({ message: 'Class not found' });
        }

        Object.assign(classToUpdate, updates);
        await classToUpdate.save();

        res.json(classToUpdate);
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({ message: 'Failed to update class' });
    }
});

// Delete a class
router.delete('/classes/:classId', async (req, res) => {
    try {
        const { classId } = req.params;

        const classToDelete = await Class.findOne({ 
            classId,
            lecturer: req.user.address 
        });

        if (!classToDelete) {
            return res.status(404).json({ message: 'Class not found' });
        }

        await classToDelete.deleteOne();
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ message: 'Failed to delete class' });
    }
});

// Get class details
router.get('/classes/:classId', async (req, res) => {
    try {
        const { classId } = req.params;

        const classDetails = await Class.findOne({ 
            classId,
            lecturer: req.user.address 
        }).populate('students', 'address name');

        if (!classDetails) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json(classDetails);
    } catch (error) {
        console.error('Error fetching class details:', error);
        res.status(500).json({ message: 'Failed to fetch class details' });
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
      //
      // For now, just record the attendance
      //const attendance = {
        //student: studentAddress,
        //date: new Date(date),
        //validated: true,
        //validatedBy: req.user.address
      //};

      //classDoc.attendance.push(attendance);
      //await classDoc.save();

      res.json({ message: 'Attendance validated successfully', attendance });
    } catch (error) {
      res.status(500).json({ message: 'Error validating attendance' });
    }
  }
);

module.exports = router; 
