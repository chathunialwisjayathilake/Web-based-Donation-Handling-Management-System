const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected");
    
    // Check bookings collection
    const db = mongoose.connection.db;
    const bookings = await db.collection('bookings').find({}).toArray();
    console.log(`Total bookings found: ${bookings.length}`);
    
    const linked = bookings.filter(b => b.campaignId);
    console.log(`Linked bookings: ${linked.length}`);
    
    if (linked.length > 0) {
      console.log("Sample Linked ID:", linked[0].campaignId);
    }
    
    const campaigns = await db.collection('DonationNeed').find({ category: 'BLOOD' }).toArray();
    console.log(`Blood Campaigns: ${campaigns.length}`);
    
    for(const c of campaigns) {
       const count = await db.collection('bookings').countDocuments({ campaignId: c._id });
       console.log(`Campaign ${c.title}: ${count}`);
    }

    process.exit(0);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

run();
