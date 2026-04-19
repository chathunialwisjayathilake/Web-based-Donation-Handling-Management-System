const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
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
  location: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'Hospital',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationship for Prisma-like 'user' field
hospitalSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Relationships
hospitalSchema.virtual('bloodRequests', {
  ref: 'BloodRequest',
  localField: '_id',
  foreignField: 'hospitalId'
});

hospitalSchema.virtual('itemRequests', {
  ref: 'ItemRequest',
  localField: '_id',
  foreignField: 'hospitalId'
});

hospitalSchema.virtual('fundRequests', {
  ref: 'FundRequest',
  localField: '_id',
  foreignField: 'hospitalId'
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
