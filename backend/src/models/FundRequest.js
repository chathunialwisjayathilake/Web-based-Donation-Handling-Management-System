const mongoose = require('mongoose');
const { RequestStatus, Priority } = require('./Constants');

const fundRequestSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  amount: {
    type: Number
  },
  approvedAmount: {
    type: Number,
    default: 0
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
  collection: 'FundRequest',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'hospital' field
fundRequestSchema.virtual('hospital', {
  ref: 'Hospital',
  localField: 'hospitalId',
  foreignField: '_id',
  justOne: true
});

const FundRequest = mongoose.model('FundRequest', fundRequestSchema);

module.exports = FundRequest;
