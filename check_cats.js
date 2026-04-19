const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Check different possible paths for the model
const modelPath = path.join(__dirname, 'backend', 'src', 'models', 'DonationNeed.js');
const DonationNeed = require(modelPath);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function checkCategories() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const needs = await DonationNeed.find({});
        console.log('Found', needs.length, 'total needs');
        
        const counts = {};
        needs.forEach(n => {
            const cat = n.category || 'undefined';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        
        console.log('Category Counts:', JSON.stringify(counts, null, 2));
        
        // List titles and categories for some
        console.log('\nSample items:');
        needs.slice(0, 15).forEach(n => {
            console.log(`- ${n.itemName || n.title} [${n.category || 'NO CATEGORY'}]`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('Error during execution:', err);
        process.exit(1);
    }
}

checkCategories();
