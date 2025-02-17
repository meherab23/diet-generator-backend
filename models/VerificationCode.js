const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  contact: { type: String, required: true }, // email or phone number
  contactType: { type: String, enum: ['email', 'phone'], required: true }, // email or phone
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

module.exports = VerificationCode;
