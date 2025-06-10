const mongoose = require('mongoose');
const User = require('./User');

const adminSchema = new mongoose.Schema({
    permissions: [{
        type: String,
        enum: ['manage_users', 'manage_lecturers', 'manage_classes', 'view_reports']
    }],
    lastLogin: {
        type: Date
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    }
});

const Admin = User.discriminator('admin', adminSchema);

module.exports = Admin; 