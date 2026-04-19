const mongoose = require('mongoose');

const bloodCollectionLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^0\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit Sri Lankan phone number!`
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'centers'
});

const BloodCollectionLocation = mongoose.model('BloodCollectionLocation', bloodCollectionLocationSchema);

module.exports = BloodCollectionLocation;
