// models/RefreshToken.js
const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  expires: {
    type: Date,
    required: true,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  revoked: { 
    type: Boolean, 
    default: false 
  },
});

// Virtual to check if the token is expired
refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});

// Virtual to check if the token is active
refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revoked && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
