const mongoose = require('mongoose');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/donation_system";

async function checkHistory() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB");
        
        const DonationHistory = mongoose.model('DonationHistory', new mongoose.Schema({}, { strict: false }), 'DonationHistory');
        
        const history = await DonationHistory.find().limit(10).sort({ createdAt: -1 });
        console.log("Recent History Records:", JSON.stringify(history, null, 2));
        
        const counts = await DonationHistory.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 }, totalQty: { $sum: "$quantity" }, totalAmt: { $sum: "$amount" } } }
        ]);
        console.log("History Stats:", JSON.stringify(counts, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkHistory();
