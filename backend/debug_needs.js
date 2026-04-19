const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DonationNeed = require('./src/models/DonationNeed');

async function debugDonationNeeds() {
    try {
        await mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const allNeeds = await DonationNeed.find({});
        console.log(`Total DonationNeed records: ${allNeeds.length}`);
        
        allNeeds.forEach(need => {
            console.log(`- ID: ${need._id}, Item: ${need.itemName}, Category: ${need.category}, Status: ${need.status}`);
        });

        const statusQuery = "all";
        const categoryQuery = "ITEM,BLOOD";
        
        let query = {};
        if (statusQuery && statusQuery !== 'all') {
            query.status = statusQuery;
        }
        
        if (categoryQuery) {
            const categories = categoryQuery.split(',').map(c => c.trim().toUpperCase());
            query.category = { $in: categories };
        }

        const filtered = await DonationNeed.find(query);
        console.log(`\nFiltered results (category=${categoryQuery}, status=${statusQuery}): ${filtered.length}`);

        process.exit(0);
    } catch (error) {
        console.error("Debug Error:", error);
        process.exit(1);
    }
}

debugDonationNeeds();
