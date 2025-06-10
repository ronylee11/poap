const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    console.log('Verifying token...');
    console.log('Cookies:', req.cookies);
    
    const token = req.cookies.token;
    if (!token) {
        console.log('No token found in cookies');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        console.log('Verifying token with secret...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = {
    verifyToken
}; 