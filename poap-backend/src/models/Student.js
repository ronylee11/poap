const mongoose = require('mongoose');
const User = require('./User');

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    enrolledClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    attendance: [{
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        },
        date: Date,
        status: {
            type: String,
            enum: ['present', 'absent', 'late'],
            default: 'absent'
        }
    }]
});

const Student = User.discriminator('student', studentSchema);

module.exports = Student; 
