const mongoose = require('mongoose');

const bloodStockSchema = new mongoose.Schema({
  bloodType: {
    type: String,
    required: true,
    unique: true
  },
  units: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'BloodStock',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const BloodStock = mongoose.model('BloodStock', bloodStockSchema);

module.exports = BloodStock;
