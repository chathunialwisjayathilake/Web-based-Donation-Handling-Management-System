const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String, // SUCCESS, WARNING, CRITICAL, INFO
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String // INVENTORY, DONATION, SYSTEM
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'Alert',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
