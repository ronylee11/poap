const mongoose = require('mongoose');
const User = require('./User');

const adminSchema = new mongoose.Schema({
    permissions: [{
        type: String,
        enum: [
            'manage_users',
            'manage_lecturers',
            'manage_classes',
            'view_reports',
            'manage_contract',
            'add_lecturers',
            'remove_lecturers'
        ]
    }],
    lastLogin: {
        type: Date
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    isContractOwner: {
        type: Boolean,
        default: false
    },
    department: {
        type: String
    },
    contactEmail: {
        type: String
    }
});

const Admin = User.discriminator('admin', adminSchema);

module.exports = Admin; 