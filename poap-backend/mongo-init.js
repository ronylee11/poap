// Create a new database and user
db = db.getSiblingDB('admin');

// Create a new database
db = db.getSiblingDB('poap-attendance');

// Create a user for the application
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [
    {
      role: 'readWrite',
      db: 'poap-attendance'
    }
  ]
});

// Create initial collections
db.createCollection('users');
db.createCollection('classes');
db.createCollection('attendance');
db.createCollection('tokens'); 
