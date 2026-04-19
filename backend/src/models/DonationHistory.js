const mongoose = require('mongoose');

const donationHistorySchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  type: {
    type: String, // Blood, Item, Fund
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  },
  details: {
    type: String
  },
  quantity: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    default: 0
  },
  subtype: {
    type: String, // 'DONATION' or 'TRANSFER'
    default: 'DONATION'
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESSFUL', 'FAILED'],
    default: 'SUCCESSFUL' // Defaulting to SUCCESSFUL for legacy data
  },
  broadcastId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationNeed',
    required: false // Only for community transfers/broadcasts
  },
  bloodType: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'DonationHistory',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const DonationHistory = mongoose.model('DonationHistory', donationHistorySchema);

module.exports = DonationHistory;
