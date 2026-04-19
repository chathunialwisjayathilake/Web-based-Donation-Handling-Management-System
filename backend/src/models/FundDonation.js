const mongoose = require('mongoose');
const { RequestStatus } = require('./Constants');

const fundDonationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentSlipUrl: {
    type: String
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING
  }
}, {
  timestamps: true,
  collection: 'FundDonation',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'donor' field
fundDonationSchema.virtual('donor', {
  ref: 'Donor',
  localField: 'donorId',
  foreignField: '_id',
  justOne: true
});

const FundDonation = mongoose.model('FundDonation', fundDonationSchema);

module.exports = FundDonation;
