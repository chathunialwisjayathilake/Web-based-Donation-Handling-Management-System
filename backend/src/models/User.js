const mongoose = require('mongoose');

const Role = {
  ADMIN: 'ADMIN',
  DONOR: 'DONOR',
  HOSPITAL: 'HOSPITAL',
  BLOOD_MANAGER: 'BLOOD_MANAGER',
  FUND_MANAGER: 'FUND_MANAGER',
  ITEM_MANAGER: 'ITEM_MANAGER',
  HOSPITAL_MANAGER: 'HOSPITAL_MANAGER',
  DONOR_MANAGER: 'DONOR_MANAGER'
};

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: Object.values(Role),
    default: Role.DONOR
  }
}, {
  timestamps: true,
  collection: 'User',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relationships
userSchema.virtual('donor', {
  ref: 'Donor',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

userSchema.virtual('hospital', {
  ref: 'Hospital',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

const User = mongoose.model('User', userSchema);

module.exports = { User, Role };
