const mongoose = require('mongoose');
const { RequestStatus, Priority } = require('./Constants');

const itemRequestSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: Object.values(Priority),
    default: Priority.ROUTINE
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING
  }
}, {
  timestamps: true,
  collection: 'ItemRequest',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'hospital' field
itemRequestSchema.virtual('hospital', {
  ref: 'Hospital',
  localField: 'hospitalId',
  foreignField: '_id',
  justOne: true
});

const ItemRequest = mongoose.model('ItemRequest', itemRequestSchema);

module.exports = ItemRequest;
