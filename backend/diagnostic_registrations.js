const mongoose = require('mongoose');
require('dotenv').config();

async function runDiagnostic() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const BloodDonation = require('./src/models/BloodDonation');
        const DonationNeed = require('./src/models/DonationNeed');

        const totalBookings = await BloodDonation.countDocuments();
        const bookingsWithCampaign = await BloodDonation.countDocuments({ campaignId: { $exists: true, $ne: null } });
        
        console.log(`Total Bookings: ${totalBookings}`);
        console.log(`Bookings with Campaign ID: ${bookingsWithCampaign}`);

        if (bookingsWithCampaign > 0) {
            const samples = await BloodDonation.find({ campaignId: { $exists: true, $ne: null } }).limit(5);
            for (const sample of samples) {
                const campaign = await DonationNeed.findById(sample.campaignId);
                console.log(`- Booking ${sample._id} linked to Campaign: ${campaign ? campaign.title : 'NOT FOUND'}`);
            }
        }

        const campaigns = await DonationNeed.find({ category: 'BLOOD' });
        console.log(`\nBlood Campaigns found: ${campaigns.length}`);
        for (const campaign of campaigns) {
            const count = await BloodDonation.countDocuments({ campaignId: campaign._id });
            console.log(`- Campaign: "${campaign.title}" | Count: ${count}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Diagnostic failed:", err);
        process.exit(1);
    }
}

runDiagnostic();
