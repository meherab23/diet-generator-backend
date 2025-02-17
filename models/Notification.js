const mongoose = require('mongoose');

// Notification Schema
const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order', 'promotion', 'system'], required: true },
    status: { type: String, enum: ['read', 'unread'], default: 'unread' },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
