const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const FundRequest = require('./src/modules/hospitalRequest/../../models/FundRequest');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    const requests = await FundRequest.find({ status: 'PENDING' });
    console.log("Found PENDING fund requests:");
    requests.forEach(r => {
      console.log(`ID: ${r._id}, Amount: ${r.amount}, Priority: ${r.priority}`);
    });
    
    if (requests.length > 0) {
        const target = requests[0];
        console.log(`Testing update on ${target._id}`);
        const updated = await FundRequest.findByIdAndUpdate(target._id, { amount: target.amount + 1 }, { new: true });
        console.log("Update result amount:", updated.amount);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
