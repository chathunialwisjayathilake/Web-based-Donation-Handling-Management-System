const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  attributes: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    default: 'Active'
  }
}, {
  timestamps: true,
  collection: 'Category',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
