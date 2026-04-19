const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: './.env' });

const DonationHistory = mongoose.model('DonationHistory', new mongoose.Schema({
    type: String,
    bloodType: String,
    details: String
}, { collection: 'DonationHistory' }));

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

async function migrate() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB...");

        const records = await DonationHistory.find({ 
            type: 'BLOOD', 
            bloodType: { $exists: false } 
        });

        console.log(`Found ${records.length} historical records to migrate.`);

        let updatedCount = 0;
        for (const rec of records) {
            for (const type of bloodTypes) {
                if (rec.details && rec.details.includes(type)) {
                    rec.bloodType = type;
                    await rec.save();
                    updatedCount++;
                    break;
                }
            }
        }

        console.log(`Successfully migrated ${updatedCount} historical stewardship records.`);
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
