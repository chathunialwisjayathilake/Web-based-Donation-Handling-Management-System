const mongoose = require('mongoose');
const { RequestStatus, Priority } = require('./Constants');

const itemSchema = new mongoose.Schema({
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
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor'
  }
}, {
  timestamps: true,
  collection: 'Item',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'donor' field
itemSchema.virtual('donor', {
  ref: 'Donor',
  localField: 'donorId',
  foreignField: '_id',
  justOne: true
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
