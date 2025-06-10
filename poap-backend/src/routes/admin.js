const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { isAdmin } = require('../middleware/roleMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');
const Lecturer = require('../models/Lecturer');

// Apply verifyToken middleware to all routes
router.use(verifyToken);
router.use(isAdmin);

// Create new account
router.post('/accounts',
  [
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['admin', 'lecturer', 'student']).withMessage('Invalid role'),
    body('studentId').optional().isString().withMessage('Invalid student ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { address, name, role, studentId } = req.body;

      // Check if account already exists
      const existingUser = await User.findOne({ address });
      if (existingUser) {
        return res.status(400).json({ message: 'Account already exists' });
      }

      // Create new user
      const user = new User({
        address,
        name,
        role,
        studentId: role === 'student' ? studentId : undefined
      });

      await user.save();
      res.status(201).json({ message: 'Account created successfully', user });
    } catch (error) {
      res.status(500).json({ message: 'Error creating account' });
    }
  }
);

// Assign role to account
router.put('/accounts/:address/role',
  [
    body('role').isIn(['admin', 'lecturer', 'student']).withMessage('Invalid role')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { address } = req.params;
      const { role } = req.body;

      const user = await User.findOne({ address });
      if (!user) {
        return res.status(404).json({ message: 'Account not found' });
      }

      user.role = role;
      await user.save();

      res.json({ message: 'Role updated successfully', user });
    } catch (error) {
      res.status(500).json({ message: 'Error updating role' });
    }
  }
);

// List all accounts
router.get('/accounts', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts' });
  }
});

// Delete account
router.delete('/accounts/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const user = await User.findOneAndDelete({ address });
    
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account' });
  }
});

// Create lecturer account
router.post('/lecturers', [
    body('address').isEthereumAddress(),
    body('name').isString().trim().notEmpty(),
    body('department').isString().trim().notEmpty(),
    body('specialization').optional().isString().trim(),
    body('officeLocation').optional().isString().trim(),
    body('contactEmail').optional().isEmail().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address, name, department, specialization, officeLocation, contactEmail } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ address });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new lecturer
        const lecturer = new Lecturer({
            address,
            name,
            role: 'lecturer',
            department,
            specialization,
            officeLocation,
            contactEmail
        });

        await lecturer.save();
        res.status(201).json({ message: 'Lecturer account created successfully', lecturer });
    } catch (error) {
        console.error('Create lecturer error:', error);
        res.status(500).json({ message: 'Failed to create lecturer account' });
    }
});

module.exports = router; 