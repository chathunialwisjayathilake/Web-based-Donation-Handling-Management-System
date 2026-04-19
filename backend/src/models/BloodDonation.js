const mongoose = require('mongoose');
const { RequestStatus } = require('./Constants');

const bloodDonationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationNeed'
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodCollectionLocation'
  },
  bloodType: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING
  },
  pintsDonated: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'bookings',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'donor' field
bloodDonationSchema.virtual('donor', {
  ref: 'Donor',
  localField: 'donorId',
  foreignField: '_id',
  justOne: true
});

const BloodDonation = mongoose.model('BloodDonation', bloodDonationSchema);

module.exports = BloodDonation;
