const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const FundRequest = require('./src/modules/hospitalRequest/../../models/FundRequest');

async function check() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to DB");
    
    const recentlyUpdated = await FundRequest.find()
      .sort({ updatedAt: -1 })
      .limit(5);

    console.log("Recently updated FundRequests:");
    recentlyUpdated.forEach(r => {
      console.log(`ID: ${r._id}, Amount: ${r.amount}, UpdatedAt: ${r.updatedAt}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
