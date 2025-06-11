const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');

// Import models
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

// Import contract ABI and address
const contractArtifact = require('../contracts/POAPAttendance.json');
const contractABI = contractArtifact.abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Initialize contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Get student profile
// /api/student/profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const { address } = req.user;
        console.log('Fetching profile for address:', address);

        // Get student details
        let student;
        try {
            student = await Student.findOne({ address });
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
            console.log('Found student:', student.name);
        } catch (error) {
            console.error('Error finding student:', error);
            return res.status(500).json({ message: 'Database error while finding student' });
        }

        // Get enrolled classes
        let enrolledClasses;
        try {
            enrolledClasses = await Class.find({ students: address });
            console.log('Found enrolled classes:', enrolledClasses.length);
        } catch (error) {
            console.error('Error finding enrolled classes:', error);
            return res.status(500).json({ message: 'Database error while finding enrolled classes' });
        }

        // Get attendance records
        let attendance;
        try {
            attendance = await Attendance.find({ student: address })
                .populate('classId', 'title')
                .sort({ markedAt: -1 });
            console.log('Found attendance records:', attendance.length);
        } catch (error) {
            console.error('Error finding attendance records:', error);
            return res.status(500).json({ message: 'Database error while finding attendance records' });
        }

        // Get NFT badges
        let badgeIds;
        try {
            console.log('Fetching badges for address:', address);
            badgeIds = await contract.getStudentBadges(address);
            console.log('Found badge IDs:', badgeIds);
        } catch (error) {
            console.error('Error fetching badge IDs:', error);
            return res.status(500).json({ 
                message: 'Failed to fetch badges',
                error: error.message,
                contractAddress: contractAddress,
                rpcUrl: process.env.RPC_URL
            });
        }

        const badges = [];
        for (const tokenId of badgeIds) {
            try {
                console.log('Fetching metadata for token:', tokenId);
                const [title, role, expiry, mintedAt, uri] = await contract.getBadgeMetadata(tokenId);
                const isValid = await contract.isBadgeValid(tokenId);
                badges.push({
                    tokenId: tokenId.toString(),
                    title,
                    role,
                    expiry: expiry.toString(),
                    mintedAt: mintedAt.toString(),
                    uri,
                    isValid
                });
                console.log('Successfully fetched metadata for token:', tokenId);
            } catch (error) {
                console.error(`Error fetching metadata for token ${tokenId}:`, error);
                // Continue with other badges even if one fails
            }
        }

        res.json({
            student,
            enrolledClasses,
            attendance,
            badges
        });
    } catch (error) {
        console.error('Unexpected error in profile route:', error);
        res.status(500).json({ 
            message: 'Failed to fetch student profile',
            error: error.message
        });
    }
});

// Update student profile
router.put('/profile', verifyToken, [
    body('name').optional().isString(),
    body('studentId').optional().isString(),
    body('graduationDate').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address } = req.user;
        const { name, studentId, graduationDate } = req.body;

        const student = await Student.findOne({ address });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update student details
        if (name) student.name = name;
        if (studentId) student.studentId = studentId;
        if (graduationDate) student.graduationDate = graduationDate;

        await student.save();

        res.json({ message: 'Profile updated successfully', student });
    } catch (error) {
        console.error('Error updating student profile:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// Get attendance statistics
router.get('/attendance/stats', verifyToken, async (req, res) => {
    try {
        const { address } = req.user;

        // Get all attendance records
        const attendance = await Attendance.find({ student: address })
            .populate('classId', 'title');

        // Calculate statistics
        const stats = attendance.reduce((acc, record) => {
            const classId = record.classId._id.toString();
            if (!acc[classId]) {
                acc[classId] = {
                    classTitle: record.classId.title,
                    total: 0,
                    attended: 0,
                    validated: 0
                };
            }

            acc[classId].total++;
            if (record.markedAt) acc[classId].attended++;
            if (record.validated) acc[classId].validated++;

            return acc;
        }, {});

        res.json(stats);
    } catch (error) {
        console.error('Error fetching attendance statistics:', error);
        res.status(500).json({ message: 'Failed to fetch attendance statistics' });
    }
});

// Get NFT badges
router.get('/badges', verifyToken, async (req, res) => {
    try {
        const { address } = req.user;

        // Get all badges
        const badges = await contract.checkNFT(address);

        // Get detailed badge information
        const badgeDetails = await Promise.all(
            badges.map(async (tokenId) => {
                const [title, role, expiry, uri] = await contract.getBadgeMetadata(tokenId);
                return {
                    tokenId,
                    title,
                    role,
                    expiry,
                    uri,
                    isValid: await contract.isBadgeValid(tokenId)
                };
            })
        );

        res.json(badgeDetails);
    } catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({ message: 'Failed to fetch badges' });
    }
});

module.exports = router; 
