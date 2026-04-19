const mongoose = require('mongoose');
const { RequestStatus, Priority } = require('./Constants');

const itemDonationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationNeed'
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  priority: {
    type: String,
    enum: Object.values(Priority),
    default: Priority.ROUTINE
  },
  description: {
    type: String
  },
  imageUrl: {
    type: String
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING
  },
  deliveryMethod: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['CARD', 'BANK_TRANSFER', 'NONE'],
    default: 'NONE'
  },
  cardNumber: {
    type: String // Masked for record keeping
  },
  bankName: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'ItemDonation',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'donor' field
itemDonationSchema.virtual('donor', {
  ref: 'Donor',
  localField: 'donorId',
  foreignField: '_id',
  justOne: true
});

const ItemDonation = mongoose.model('ItemDonation', itemDonationSchema);

module.exports = ItemDonation;
