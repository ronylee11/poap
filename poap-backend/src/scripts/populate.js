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
    },
    {
        address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
        name: 'Prof. Emily Davis',
        department: 'Computer Science',
        specialization: 'Software Engineering',
        officeLocation: 'Building A, Room 104',
        contactEmail: 'emily.davis@university.edu'
    },
    {
        address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
        name: 'Dr. Robert Wilson',
        department: 'Mathematics',
        specialization: 'Statistics',
        officeLocation: 'Building B, Room 205',
        contactEmail: 'robert.wilson@university.edu'
    },
    {
        address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
        name: 'Prof. Lisa Anderson',
        department: 'Physics',
        specialization: 'Electromagnetism',
        officeLocation: 'Building C, Room 306',
        contactEmail: 'lisa.anderson@university.edu'
    },
    {
        address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
        name: 'Dr. James Taylor',
        department: 'Computer Science',
        specialization: 'Database Systems',
        officeLocation: 'Building A, Room 107',
        contactEmail: 'james.taylor@university.edu'
    },
    {
        address: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
        name: 'Prof. Patricia Martinez',
        department: 'Mathematics',
        specialization: 'Linear Algebra',
        officeLocation: 'Building B, Room 208',
        contactEmail: 'patricia.martinez@university.edu'
    },
    {
        address: '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
        name: 'Dr. William Thompson',
        department: 'Physics',
        specialization: 'Thermodynamics',
        officeLocation: 'Building C, Room 309',
        contactEmail: 'william.thompson@university.edu'
    },
    {
        address: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
        name: 'Prof. Jennifer White',
        department: 'Computer Science',
        specialization: 'Computer Networks',
        officeLocation: 'Building A, Room 110',
        contactEmail: 'jennifer.white@university.edu'
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
        lecturer: null
    },
    {
        classId: 'MATH201',
        name: 'Advanced Mathematics',
        description: 'Advanced mathematical concepts and applications',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        schedule: 'Tuesday, Thursday 13:00-14:30',
        department: 'Mathematics',
        lecturer: null
    },
    {
        classId: 'PHYS301',
        name: 'Quantum Physics',
        description: 'Introduction to quantum mechanics and its applications',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        schedule: 'Monday, Friday 15:00-16:30',
        department: 'Physics',
        lecturer: null
    },
    {
        classId: 'CS201',
        name: 'Database Systems',
        description: 'Design and implementation of database systems',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        schedule: 'Wednesday, Friday 09:00-10:30',
        department: 'Computer Science',
        lecturer: null
    },
    {
        classId: 'CS301',
        name: 'Software Engineering',
        description: 'Software development methodologies and practices',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        schedule: 'Tuesday, Thursday 11:00-12:30',
        department: 'Computer Science',
        lecturer: null
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

        // Group lecturers by department
        const lecturersByDepartment = lecturers.reduce((acc, lecturer) => {
            if (!acc[lecturer.department]) {
                acc[lecturer.department] = [];
            }
            acc[lecturer.department].push(lecturer);
            return acc;
        }, {});

        // Create classes and assign lecturers based on department
        const classes = await Promise.all(
            classData.map(async (data) => {
                const departmentLecturers = lecturersByDepartment[data.department] || [];
                if (departmentLecturers.length === 0) {
                    console.warn(`No lecturers found for department: ${data.department}`);
                    return null;
                }

                // Assign lecturer based on specialization if possible
                let assignedLecturer = departmentLecturers.find(l => 
                    l.specialization && data.name.toLowerCase().includes(l.specialization.toLowerCase())
                );

                // If no matching specialization, assign randomly from department
                if (!assignedLecturer) {
                    assignedLecturer = departmentLecturers[Math.floor(Math.random() * departmentLecturers.length)];
                }

                return Class.create({
                    ...data,
                    lecturer: assignedLecturer._id
                });
            })
        );

        // Filter out any null classes (where no lecturer was found)
        const validClasses = classes.filter(c => c !== null);
        console.log('Created', validClasses.length, 'classes');

        // Update lecturers with their classes
        for (const lecturer of lecturers) {
            const lecturerClasses = validClasses.filter(c => 
                c.lecturer.toString() === lecturer._id.toString()
            );
            
            await Lecturer.findByIdAndUpdate(lecturer._id, {
                classes: lecturerClasses.map(c => c._id)
            });
        }
        console.log('Updated lecturer class assignments');

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
