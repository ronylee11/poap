const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Lecturer = require('../models/Lecturer');
const Class = require('../models/Class');
require('dotenv').config();

// Sample data
const adminData = {
    address: '0xdcdA8dd5759fA2bae1D22CEC6fAC2fA0D981ca80', // real acc 3
    name: 'Admin User',
    role: 'admin',
    permissions: ['manage_users', 'manage_lecturers', 'manage_classes', 'view_reports'],
    isSuperAdmin: true
};

const lecturerData = [
    {
        address: '0x61d6f5D4a07D20b5373555592C607b144165dF73', // real acc 4
        name: 'Dr. John Smith',
        department: 'Computer Science',
        specialization: 'Artificial Intelligence',
        officeLocation: 'Building A, Room 101',
        contactEmail: 'john.smith@university.edu'
    },
    {
        address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        name: 'Prof. Sarah Johnson',
        department: 'Mathematics',
        specialization: 'Applied Mathematics',
        officeLocation: 'Building B, Room 202',
        contactEmail: 'sarah.johnson@university.edu'
    },
    {
        address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        name: 'Dr. Michael Brown',
        department: 'Physics',
        specialization: 'Quantum Physics',
        officeLocation: 'Building C, Room 303',
        contactEmail: 'michael.brown@university.edu'
    }
];

const classData = [
    {
        classId: 'CS101',
        name: 'Introduction to Programming',
        description: 'Basic programming concepts and problem-solving techniques',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        schedule: 'Monday, Wednesday 10:00-11:30',
        department: 'Computer Science',
        lecturer: '0x61d6f5D4a07D20b5373555592C607b144165dF73' // Dr. John Smith
    },
    {
        classId: 'MATH201',
        name: 'Advanced Mathematics',
        description: 'Advanced mathematical concepts and applications',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        schedule: 'Tuesday, Thursday 13:00-14:30',
        department: 'Mathematics',
        lecturer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' // Prof. Sarah Johnson
    },
    {
        classId: 'PHYS301',
        name: 'Quantum Physics',
        description: 'Introduction to quantum mechanics and its applications',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        schedule: 'Monday, Friday 15:00-16:30',
        department: 'Physics',
        lecturer: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' // Dr. Michael Brown
    }
];

async function populateDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Class.deleteMany({});
        console.log('Cleared existing data');

        // Create admin
        const admin = await Admin.create(adminData);
        console.log('Created admin account:', admin.name);

        // Create lecturers
        const lecturers = await Promise.all(
            lecturerData.map(data => 
                Lecturer.create({
                    ...data,
                    role: 'lecturer'
                })
            )
        );
        console.log('Created', lecturers.length, 'lecturer accounts');

        // Create classes with direct lecturer assignments
        const classes = await Promise.all(
            classData.map(async (data) => {
                const newClass = await Class.create(data);
                console.log(`Created class ${newClass.name} assigned to lecturer ${data.lecturer}`);
                return newClass;
            })
        );
        console.log('Created', classes.length, 'classes');

        console.log('Database population completed successfully');
    } catch (error) {
        console.error('Error populating database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the population script
populateDatabase(); 
 
