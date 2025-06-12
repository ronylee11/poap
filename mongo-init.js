// Create a new database and user
db = db.getSiblingDB('admin');

// Create a new database
db = db.getSiblingDB('myapp');

// Create a user for the application
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [
    {
      role: 'readWrite',
      db: 'myapp'
    }
  ]
});

// Create some initial collections
db.createCollection('users');
db.createCollection('data'); 