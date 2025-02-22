// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_ACCESS_SECRET } = process.env;

exports.protect = async (req, res, next) => {
  const authHeader = req.cookies.accessToken; // Extract token from cookies
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  const token = authHeader; // Direct access since it's already in the cookies
  if (!token) return res.status(401).json({ message: 'Unauthorized: Invalid token format' });

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized: User not found' });

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error('Error in authMiddleware:', error);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
