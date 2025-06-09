const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    student: {
        type: String,
        required: true,
        lowercase: true
    },
    markedAt: {
        type: Date
    },
    validated: {
        type: Boolean,
        default: false
    },
    validatedAt: {
        type: Date
    },
    tokenId: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index for classId and student
attendanceSchema.index({ classId: 1, student: 1 });

// Update the updatedAt timestamp before saving
attendanceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Attendance', attendanceSchema); 