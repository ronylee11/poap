const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: String,
        required: true,
        ref: 'User'
    },
    date: {
        type: Date,
        required: true
    },
    validated: {
        type: Boolean,
        default: false
    },
    validatedBy: {
        type: String,
        ref: 'User'
    },
    nftMinted: {
        type: Boolean,
        default: false
    },
    nftTokenId: {
        type: String
    }
}, { timestamps: true });

const classSchema = new mongoose.Schema({
    classId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    schedule: {
        type: String
    },
    lecturer: {
        type: String,
        required: true,
        ref: 'User'
    },
    students: [{
        type: String,
        ref: 'User'
    }],
    attendance: [attendanceSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
classSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for better query performance
classSchema.index({ lecturer: 1 });
classSchema.index({ students: 1 });

module.exports = mongoose.model('Class', classSchema); 