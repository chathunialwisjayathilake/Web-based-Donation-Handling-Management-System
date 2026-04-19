const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null = broadcast/global notification for all donors
  },
  type: {
    type: String,
    enum: ['CAMPAIGN', 'URGENT', 'GENERAL', 'BLOOD_DRIVE', 'FUND_NEED'],
    default: 'GENERAL'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  collection: 'Notification',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
