const mongoose = require('mongoose');
const User = require('./User');

const lecturerSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true
    },
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    specialization: {
        type: String
    },
    officeLocation: {
        type: String
    },
    contactEmail: {
        type: String
    }
});

const Lecturer = User.discriminator('lecturer', lecturerSchema);

module.exports = Lecturer; 