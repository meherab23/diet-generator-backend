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

// 5. Verify Email (Send verification email)
// exports.verifyEmail = async (req, res) => {
//   const { email } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const verificationCode = Math.floor(100000 + Math.random() * 900000);
//     user.email_verification_code = verificationCode;
//     await user.save();

//     const mailOptions = {
//       from: EMAIL_USER,
//       to: email,
//       subject: 'Verify Your Email Address',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
//           <h2 style="color: #4CAF50; text-align: center;">Verify Your Email Address</h2>
//           <p style="font-size: 16px; color: #333;">Hi <strong>${user.username}</strong>,</p>
//           <p style="font-size: 16px; color: #333;">
//             Welcome to Zabihaty! Please use the verification code below to verify your email address:
//           </p>
//           <div style="text-align: center; margin: 20px 0;">
//             <span style="display: inline-block; padding: 15px 25px; font-size: 24px; color: #fff; background-color: #4CAF50; border-radius: 5px;">
//               ${verificationCode}
//             </span>
//           </div>
//           <p style="font-size: 14px; color: #555;">
//             If you did not request this, please ignore this email or contact our support team for assistance.
//           </p>
//           <p style="font-size: 14px; color: #555;">Thank you for joining us!<br/>The Zabihaty Team</p>
//         </div>
//       `,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error('Error sending email:', error);
//         return res.status(500).json({ message: 'Failed to send email', error: error.message });
//       }
//       console.log('Email sent:', info.response);
//       res.status(200).json({ message: 'Verification code sent to email' });
//     });
//   } catch (error) {
//     console.error('Error in verifyEmail:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// 6. Verify Phone (Telnyx SMS verification)
// exports.verifyPhone = async (req, res) => {
//   const { phone } = req.body;
//   try {
//     const user = await User.findOne({ phone });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code
//     user.phone_verification_code = verificationCode;
//     await user.save();

//     telnyx.messages.create({
//       from: TELNYX_PHONE_NUMBER,
//       to: phone,
//       text: `Your verification code is: ${verificationCode}`,
//     })
//     .then(() => {
//       res.status(200).json({ message: 'Verification code sent to phone' });
//     })
//     .catch((error) => {
//       res.status(500).json({ message: 'Failed to send SMS', error: error.message });
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// 7. Resend Verification Code (Email or Phone)
// exports.resendVerificationCode = async (req, res) => {
//   const { email, phone } = req.body;
//   try {
//     let user;
//     if (email) user = await User.findOne({ email });
//     if (phone) user = await User.findOne({ phone });

//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code
//     user.email_verification_code = verificationCode;
//     await user.save();

//     if (email) {
//       const mailOptions = {
//         from: EMAIL_USER,
//         to: email,
//         subject: 'Verify Your Email Address',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
//             <h2 style="color: #4CAF50; text-align: center;">Zabihaty Email Verification</h2>
//             <p style="font-size: 16px; color: #333;">Hi <strong>${user.username}</strong>,</p>
//             <p style="font-size: 16px; color: #333;">
//               Thank you for signing up with Zabihaty! Please use the verification code below to verify your email address:
//             </p>
//             <div style="text-align: center; margin: 20px 0;">
//               <span style="display: inline-block; padding: 15px 25px; font-size: 24px; color: #fff; background-color: #4CAF50; border-radius: 5px;">
//                 ${verificationCode}
//               </span>
//             </div>
//             <p style="font-size: 14px; color: #555;">
//               If you did not request this, please ignore this email or contact our support team.
//             </p>
//             <p style="font-size: 14px; color: #555;">Best Regards,<br/>The Zabihaty Team</p>
//           </div>
//         `,
//       };

//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) return res.status(500).json({ message: 'Failed to send email', error: error.message });
//         res.status(200).json({ message: 'Verification code resent to email' });
//       });
//     } else if (phone) {
//       telnyx.messages.create({
//         from: TELNYX_PHONE_NUMBER,
//         to: phone,
//         text: `Your verification code is: ${verificationCode}`,
//       })
//       .then(() => {
//         res.status(200).json({ message: 'Verification code resent to phone' });
//       })
//       .catch((error) => {
//         res.status(500).json({ message: 'Failed to send SMS', error: error.message });
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// 8. Verify Code (Email or Phone)
// exports.verifyCode = async (req, res) => {
//   const { email, phone, code } = req.body;
//   try {
//     let user;
//     if (email) user = await User.findOne({ email });
//     if (phone) user = await User.findOne({ phone });

//     if (!user) return res.status(404).json({ message: 'User not found' });

//     if (email && user.email_verification_code !== code) {
//       return res.status(400).json({ message: 'Invalid email verification code' });
//     }

//     if (phone && user.phone_verification_code !== code) {
//       return res.status(400).json({ message: 'Invalid phone verification code' });
//     }

//     if (email) {
//       user.email_verification_code = null;
//       user.email_verified = true;
//     }

//     if (phone) {
//       user.phone_verification_code = null;
//       user.phone_verified = true;
//     }

//     await user.save();
//     res.status(200).json({ message: 'Verification successful', status: 'verified' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// 9. Change Password
// exports.changePassword = async (req, res) => {
//   const { oldPassword, newPassword } = req.body;
//   const userId = req.user.id;

//   try {
//     const user = await User.findById(userId);
//     const isMatch = await bcrypt.compare(oldPassword, user.password);
//     if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

//     const hashedNewPassword = await bcrypt.hash(newPassword, 10);
//     user.password = hashedNewPassword;
//     await user.save();
//     res.status(200).json({ message: 'Password changed successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// 10. Delete Account
// exports.deleteAccount = async (req, res) => {
//   const userId = req.user.id;

//   try {
//     await User.findByIdAndDelete(userId);
//     res.status(200).json({ message: 'Account deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// 11. Get Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password field
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};