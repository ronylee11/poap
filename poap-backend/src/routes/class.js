const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');

// Import models
const Class = require('../models/Class');
const Student = require('../models/Student');

// Import contract ABI and address
const contractArtifact = require('../contracts/POAPAttendance.json');
const contractABI = contractArtifact.abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Initialize contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Get all classes for a user
router.get('/', async (req, res) => {
    try {
        const { address } = req.user;
        
        // Get all classes where the user is either a student or lecturer
        const classes = await Class.find({
            $or: [
                { students: address },
                { lecturer: address }
            ]
        });

        res.json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ message: 'Failed to fetch classes' });
    }
});

// Create a new class
router.post('/', [
    body('classId').isString(),
    body('title').isString(),
    body('description').isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { classId, title, description } = req.body;
        const { address } = req.user;

        // Create class in database
        const newClass = new Class({
            classId,
            title,
            description,
            lecturer: address
        });

        await newClass.save();

        res.status(201).json(newClass);
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ message: 'Failed to create class' });
    }
});

// Get class details
router.get('/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const classDetails = await Class.findOne({ classId });
        
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
router.post('/:classId/enroll', [
    body('studentAddress').isEthereumAddress()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { classId } = req.params;
        const { studentAddress } = req.body;

        const classDetails = await Class.findOne({ classId });
        if (!classDetails) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Check if user is the lecturer
        if (classDetails.lecturer !== req.user.address) {
            return res.status(403).json({ message: 'Only lecturer can enroll students' });
        }

        // Add student to class
        if (!classDetails.students.includes(studentAddress)) {
            classDetails.students.push(studentAddress);
            await classDetails.save();
        }

        res.json({ message: 'Student enrolled successfully' });
    } catch (error) {
        console.error('Error enrolling student:', error);
        res.status(500).json({ message: 'Failed to enroll student' });
    }
});

module.exports = router; 