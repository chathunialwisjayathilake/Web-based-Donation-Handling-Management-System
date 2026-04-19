const mongoose = require('mongoose');
const { RequestStatus, Priority } = require('./Constants');

const bloodRequestSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  bloodType: {
    type: String,
    required: true
  },
  units: {
    type: Number,
    required: true
  },
  dispatchedUnits: {
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
  collection: 'BloodRequest',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'hospital' field
bloodRequestSchema.virtual('hospital', {
  ref: 'Hospital',
  localField: 'hospitalId',
  foreignField: '_id',
  justOne: true
});

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

module.exports = BloodRequest;
