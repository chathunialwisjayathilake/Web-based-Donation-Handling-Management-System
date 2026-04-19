const mongoose = require('mongoose');
const { RequestStatus, Priority } = require('./Constants');

const donationNeedSchema = new mongoose.Schema({
  title: {
    type: String
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true
  },
  donatedQuantity: {
    type: String,
    default: '0'
  },
  transferredQuantity: {
    type: String,
    default: '0'
  },
  pendingTransferQuantity: {
    type: String,
    default: '0'
  },
  priority: {
    type: String,
    enum: Object.values(Priority),
    default: Priority.ROUTINE
  },
  category: {
    type: String
  },
  description: {
    type: String
  },
  imageUrl: {
    type: String
  },
  location: {
    type: String
  },
  contact: {
    type: String
  },
  date: {
    type: String
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  hospitalRequestId: {
    type: mongoose.Schema.Types.ObjectId
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING
  }
}, {
  timestamps: true,
  collection: 'DonationNeed',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const DonationNeed = mongoose.model('DonationNeed', donationNeedSchema);

module.exports = DonationNeed;
