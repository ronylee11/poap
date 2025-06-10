const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Import models
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

// Validate attendance
router.post('/validate', [
    body('classId').isString(),
    body('studentAddress').isEthereumAddress()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { classId, studentAddress } = req.body;
        const { address } = req.user;

        // Check if user is the lecturer
        const classDetails = await Class.findOne({ 
            classId,
            lecturer: address
        });

        if (!classDetails) {
            return res.status(403).json({ message: 'Not authorized to validate attendance' });
        }

        // Check if student is enrolled in the class
        if (!classDetails.students.includes(studentAddress)) {
            return res.status(403).json({ message: 'Student is not enrolled in this class' });
        }

        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if attendance was already validated today
        const existingAttendance = await Attendance.findOne({
            classId,
            student: studentAddress,
            validated: true,
            validatedAt: {
                $gte: today
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ 
                message: 'Attendance already validated for this student today',
                validatedAt: existingAttendance.validatedAt
            });
        }

        // Create attendance record
        const attendance = new Attendance({
            classId,
            student: studentAddress,
            validated: true,
            validatedAt: new Date()
        });

        await attendance.save();

        res.json({ 
            message: 'Attendance validated successfully',
            validatedAt: attendance.validatedAt
        });
    } catch (error) {
        console.error('Error validating attendance:', error);
        res.status(500).json({ 
            message: 'Failed to validate attendance',
            error: error.message
        });
    }
});

// Get attendance for a class
router.get('/class/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const { address } = req.user;

        // Check if user is authorized (lecturer or student)
        const classDetails = await Class.findOne({
            classId,
            $or: [
                { lecturer: address },
                { students: address }
            ]
        });

        if (!classDetails) {
            return res.status(403).json({ message: 'Not authorized to view attendance' });
        }

        const attendance = await Attendance.find({ classId })
            .populate('student', 'address name')
            .sort({ validatedAt: -1 });

        res.json(attendance);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Failed to fetch attendance' });
    }
});

module.exports = router; 