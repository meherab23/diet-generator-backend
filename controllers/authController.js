// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const nodemailer = require('nodemailer');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  EMAIL_USER,
  EMAIL_PASS,
  NODE_ENV,
  // CLIENT_URL, // Add your frontend client URL in environment variables
} = process.env;

// Nodemailer transporter for email verification using Outlook SMTP server
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',    // Server name
  port: 587,                     // Outgoing server port (STARTTLS)
  secure: false,                 // Use TLS
  auth: {
    user: EMAIL_USER,            
    pass: EMAIL_PASS,            
  },
  tls: {
    ciphers: 'SSLv3'              // Secure Cipher Suite
  },
});

// Helper function to generate JWT tokens (access & refresh)
const generateToken = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' } // 15 minutes expiration for access token
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 days expiration for refresh token
  );
  
  return { accessToken, refreshToken };
};

// Helper function to save refresh token in the database
const saveRefreshToken = async (token, userId) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days validity

  const refreshToken = new RefreshToken({
    token,
    user: userId,
    expires,
  });

  await refreshToken.save();
};

// Helper function to remove refresh token from the database
const removeRefreshToken = async (token) => {
  await RefreshToken.findOneAndDelete({ token });
};

// Helper function to verify refresh token
const verifyRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ token }).populate('user');
  if (!refreshToken || refreshToken.revoked || refreshToken.isExpired) {
    throw new Error('Invalid refresh token');
  }
  return refreshToken.user;
};

// Controller Functions

// 1. Register User
exports.register = async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, username, password: password });
    await newUser.save();

    const { accessToken, refreshToken } = generateToken(newUser);
    await saveRefreshToken(refreshToken, newUser._id);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production', // Set to true in production
      sameSite: 'Strict', // Mitigates CSRF
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
  
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateToken(user);
    await saveRefreshToken(refreshToken, user._id);

    // Set access token in HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production', // Set to true in production
      sameSite: 'Strict',
      path: '/api',
      maxAge: 15 * 60 * 1000, // 15 minutes expiration
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
    });

    res.status(200).json({ accessToken, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Logout (Invalidate Refresh Token)
exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await removeRefreshToken(refreshToken);
  }
  
  // Clear the refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/api/auth/refresh',
  });

  res.status(200).json({ message: 'Logout successful' });
};

// 4. Refresh Access Token
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(400).json({ message: 'No refresh token provided' });

  try {
    const user = await verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = generateToken(user);

    // Optionally, revoke the old refresh token and save the new one
    await removeRefreshToken(refreshToken);
    await saveRefreshToken(newRefreshToken, user._id);

    // Set the new refresh token in HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production', // Set to true in production
      sameSite: 'Strict', // Mitigates CSRF
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// 11. Get Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password field
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};