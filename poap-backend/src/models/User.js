const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'lecturer', 'student'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  discriminatorKey: 'role'
});

// Update timestamps on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods for role checking
userSchema.statics.isAdmin = async function(address) {
  const user = await this.findOne({ address, role: 'admin' });
  return !!user;
};

userSchema.statics.isLecturer = async function(address) {
  const user = await this.findOne({ address, role: 'lecturer' });
  return !!user;
};

userSchema.statics.isStudent = async function(address) {
  const user = await this.findOne({ address, role: 'student' });
  return !!user;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 