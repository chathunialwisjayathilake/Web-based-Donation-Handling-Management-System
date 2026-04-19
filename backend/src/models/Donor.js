const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  bloodType: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'Donor',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'user' field
donorSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Relationships
donorSchema.virtual('bloodDonations', {
  ref: 'BloodDonation',
  localField: '_id',
  foreignField: 'donorId'
});

donorSchema.virtual('itemDonations', {
  ref: 'ItemDonation',
  localField: '_id',
  foreignField: 'donorId'
});

donorSchema.virtual('items', {
  ref: 'Item',
  localField: '_id',
  foreignField: 'donorId'
});

donorSchema.virtual('fundDonations', {
  ref: 'FundDonation',
  localField: '_id',
  foreignField: 'donorId'
});

donorSchema.virtual('history', {
  ref: 'DonationHistory',
  localField: '_id',
  foreignField: 'donorId'
});

const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;
