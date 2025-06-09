const request = require('supertest');
const { ethers } = require('ethers');
const mongoose = require('mongoose');
const app = require('../src/index');
const Student = require('../src/models/Student');
const Class = require('../src/models/Class');
const Attendance = require('../src/models/Attendance');

// Test data
const testWallet = new ethers.Wallet(process.env.TEST_PRIVATE_KEY);
const testAddress = testWallet.address;
const testMessage = 'Sign this message to authenticate with POAP Attendance System';

describe('API Integration Tests', () => {
  let authToken;
  let testClassId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST);
    
    // Clean up test data
    await Student.deleteMany({});
    await Class.deleteMany({});
    await Attendance.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Authentication', () => {
    it('should sign in with valid signature', async () => {
      const signature = await testWallet.signMessage(testMessage);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: testAddress,
          signature
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('address', testAddress);
    });
  });

  describe('Class Management', () => {
    it('should create a new class', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Cookie', [`token=${authToken}`])
        .send({
          classId: 'TEST101',
          title: 'Test Class',
          description: 'A test class for integration testing'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      testClassId = response.body._id;
    });

    it('should get all classes', async () => {
      const response = await request(app)
        .get('/api/classes')
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Attendance Management', () => {
    it('should mark attendance', async () => {
      const response = await request(app)
        .post('/api/attendance/mark')
        .set('Cookie', [`token=${authToken}`])
        .send({
          classId: testClassId
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('markedAt');
    });

    it('should validate attendance', async () => {
      const response = await request(app)
        .post('/api/attendance/validate')
        .set('Cookie', [`token=${authToken}`])
        .send({
          classId: testClassId,
          studentAddress: testAddress
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('validated', true);
    });

    it('should get attendance records', async () => {
      const response = await request(app)
        .get(`/api/attendance/${testClassId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Student Profile', () => {
    it('should update student profile', async () => {
      const response = await request(app)
        .put('/api/student/profile')
        .set('Cookie', [`token=${authToken}`])
        .send({
          name: 'Test Student',
          studentId: 'TEST123',
          graduationDate: '2024-12-31'
        });

      expect(response.status).toBe(200);
      expect(response.body.student).toHaveProperty('name', 'Test Student');
    });

    it('should get student profile with badges', async () => {
      const response = await request(app)
        .get('/api/student/profile')
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('student');
      expect(response.body).toHaveProperty('badges');
    });
  });
}); 