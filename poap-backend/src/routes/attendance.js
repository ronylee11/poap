const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');

// Import models
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Student = require('../models/Student');

// Import contract ABI and address
const contractArtifact = require('../contracts/POAPAttendance.json');
const contractABI = contractArtifact.abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Initialize contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Mark attendance
router.post('/mark', [
    body('classId').isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { classId } = req.body;
        const { address } = req.user;

        // Check if student is enrolled in the class
        const classDetails = await Class.findOne({ 
            classId,
            students: address
        });

        if (!classDetails) {
            return res.status(403).json({ message: 'Not enrolled in this class' });
        }

        // Mark attendance in database
        const attendance = new Attendance({
            classId,
            student: address,
            markedAt: new Date(),
            validated: false
        });

        await attendance.save();

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Failed to mark attendance' });
    }
});

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

        // Check if student has marked attendance
        const attendance = await Attendance.findOne({
            classId,
            student: studentAddress,
            validated: false
        });

        if (!attendance) {
            return res.status(404).json({ message: 'No pending attendance to validate' });
        }

        // Validate attendance in database
        attendance.validated = true;
        attendance.validatedAt = new Date();
        await attendance.save();

        // Mint NFT
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contractWithSigner = contract.connect(signer);

        const tokenURI = `ipfs://${classId}/${studentAddress}`; // You might want to generate a proper IPFS URI
        const eventTitle = classDetails.title;
        const role = 'Student';
        const expiryTime = 0; // No expiry

        const tx = await contractWithSigner.mintBadge(
            studentAddress,
            tokenURI,
            eventTitle,
            role,
            expiryTime
        );

        await tx.wait();

        res.json({ 
            message: 'Attendance validated and NFT minted successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error validating attendance:', error);
        res.status(500).json({ message: 'Failed to validate attendance' });
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
            .sort({ markedAt: -1 });

        res.json(attendance);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Failed to fetch attendance' });
    }
});

module.exports = router; 