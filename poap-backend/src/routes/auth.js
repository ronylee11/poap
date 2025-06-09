const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');

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

// Register with wallet signature
router.post('/register', [
    body('address').isEthereumAddress(),
    body('signature').isString(),
    body('message').isString(),
    body('name').isString().trim().notEmpty(),
    body('studentId').isString().trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address, signature, message, name, studentId } = req.body;

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ message: 'Invalid signature' });
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ address });
        if (existingStudent) {
            return res.status(400).json({ message: 'Student already registered' });
        }

        // Create new student
        const student = new Student({
            address,
            name,
            studentId,
            role: 'student'
        });

        await student.save();

        // Generate JWT token
        const token = jwt.sign(
            { address, role: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Check if user is registered
router.get('/check-registration/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const student = await Student.findOne({ address });
        res.json({ isRegistered: !!student });
    } catch (error) {
        console.error('Check registration error:', error);
        res.status(500).json({ message: 'Failed to check registration' });
    }
});

// Login with wallet signature
router.post('/login', [
    body('address').isEthereumAddress(),
    body('signature').isString(),
    body('message').isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address, signature, message } = req.body;

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ message: 'Invalid signature' });
        }

        // Check if student exists
        const student = await Student.findOne({ address });
        if (!student) {
            return res.status(401).json({ message: 'Student not registered' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { address, role: student.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ address: req.user.address });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ user: { ...req.user, name: student.name, studentId: student.studentId } });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Failed to get user' });
    }
});

module.exports = router; 