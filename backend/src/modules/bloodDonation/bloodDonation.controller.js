const BloodStock = require('../../models/BloodStock');
const BloodDonation = require('../../models/BloodDonation');
const Donor = require('../../models/Donor');
const DonationNeed = require('../../models/DonationNeed');
const BloodCollectionLocation = require('../../models/BloodCollectionLocation');
const DonationHistory = require('../../models/DonationHistory');
const { RequestStatus } = require('../../models/Constants');

// Get all blood stock
const getBloodStock = async (req, res) => {
    try {
        const stocks = await BloodStock.find();
        res.status(200).json(stocks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blood stock", error: error.message });
    }
};

// Update blood stock
const updateBloodStock = async (req, res) => {
    const { bloodType, units } = req.body;
    try {
        let stock = await BloodStock.findOne({ bloodType });
        if (stock) {
            stock.units = Number(units);
            stock.lastUpdated = Date.now();
            await stock.save();
        } else {
            stock = await BloodStock.create({ bloodType, units: Number(units) });
        }
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ message: "Error updating blood stock", error: error.message });
    }
};

// Seed initial blood types
const seedBloodStock = async (req, res) => {
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    try {
        const operations = bloodTypes.map(type => ({
            updateOne: {
                filter: { bloodType: type },
                update: { 
                    $setOnInsert: { 
                        units: Math.floor(Math.random() * 60) + 20, 
                        lastUpdated: Date.now() 
                    } 
                },
                upsert: true
            }
        }));
        await BloodStock.bulkWrite(operations);
        const allStock = await BloodStock.find();
        res.status(200).json({ message: "Blood stock seeded successfully", data: allStock });
    } catch (error) {
        res.status(500).json({ message: "Error seeding blood stock", error: error.message });
    }
};

// Get all blood donations/bookings for the manager
const getAllDonations = async (req, res) => {
    try {
        const donations = await BloodDonation.find()
            .populate('donorId')
            .populate('campaignId', 'title itemName location date')
            .populate('hospitalId', 'name city address')
            .sort({ createdAt: -1 });
        
        res.status(200).json(donations);
    } catch (error) {
        console.error("Error fetching all donations:", error);
        res.status(500).json({ message: "Error fetching all donations", error: error.message });
    }
};

// Update donation recording (Lifecycle & Logistics Management)
const updateDonation = async (req, res) => {
    const { id } = req.params;
        const { status, date, timeSlot, pintsDonated } = req.body;

        try {
            const oldDonation = await BloodDonation.findById(id);
            if (!oldDonation) {
                return res.status(404).json({ message: "Booking record not found" });
            }

            const updateData = {};
            if (status) {
                if (!Object.values(RequestStatus).includes(status)) {
                    return res.status(400).json({ message: "Invalid status state" });
                }
                updateData.status = status;
            }
            if (date) updateData.date = date;
            if (timeSlot) updateData.timeSlot = timeSlot;
            if (pintsDonated) updateData.pintsDonated = Number(pintsDonated);

            // AUTO-STOCK LOGIC: If status transitions to COMPLETED
            const incrementVal = Number(pintsDonated);
            if (status === 'COMPLETED' && oldDonation.status !== 'COMPLETED' && incrementVal > 0) {
                console.log(`[Stewardship Sync] Incrementing ${oldDonation.bloodType} stock by ${incrementVal} pints.`);
                const stockUpdate = await BloodStock.findOneAndUpdate(
                    { bloodType: oldDonation.bloodType },
                    { $inc: { units: incrementVal }, lastUpdated: Date.now() },
                    { upsert: true, new: true }
                );

                // AUDIT LOG: Record the incoming donation in history
                await DonationHistory.create({
                    donorId: oldDonation.donorId,
                    type: 'BLOOD',
                    subtype: 'DONATION',
                    referenceId: id,
                    hospitalId: oldDonation.hospitalId,
                    quantity: incrementVal,
                    bloodType: oldDonation.bloodType, // Explicit blood type for history filtering
                    details: `Donor contribution of ${incrementVal} pints finalized.`
                });

                console.log(`[Stewardship Sync] New Stock Level: ${stockUpdate.units} pints.`);
            }

            const donation = await BloodDonation.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            );

            res.status(200).json(donation);
    } catch (error) {
        res.status(500).json({ message: "Error updating booking", error: error.message });
    }
};

// Get all donations/bookings for a specific donor
const getDonorDonations = async (req, res) => {
    const { donorId } = req.params; // This might be a User ID from frontend
    try {
        // Resolve the actual Donor document first
        const donorRecord = await Donor.findOne({ 
            $or: [
                { _id: donorId },
                { userId: donorId }
            ]
        });

        if (!donorRecord) {
            return res.status(200).json([]); // No profile yet means no bookings
        }

        const donations = await BloodDonation.find({ donorId: donorRecord._id })
            .populate('campaignId', 'title location date')
            .populate('hospitalId', 'name city address')
            .sort({ createdAt: -1 });
        
        res.status(200).json(donations);
    } catch (error) {
        console.error("Error fetching donor donations:", error);
        res.status(500).json({ message: "Error fetching your donations", error: error.message });
    }
};

// Delete donation booking
const deleteDonation = async (req, res) => {
    const { id } = req.params;
    try {
        const donation = await BloodDonation.findByIdAndDelete(id);
        if (!donation) {
            return res.status(404).json({ message: "Booking record not found" });
        }
        res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting booking", error: error.message });
    }
};

// Unified Activity Center: Aggregates Donations, Transfers, and Revisions
const getBloodActivity = async (req, res) => {
    const { bloodType } = req.params;
    try {
        // Fetch all history associated with this blood group
        const activity = await DonationHistory.find({ 
            type: 'BLOOD',
            bloodType: bloodType
        })
        .populate('donorId', 'name')
        .populate('hospitalId', 'name')
        .sort({ createdAt: -1 })
        .limit(50); // Keep dashboard performant
        
        res.status(200).json(activity);
    } catch (error) {
        console.error("Error fetching blood activity:", error);
        res.status(500).json({ message: "Error fetching activity center", error: error.message });
    }
};

module.exports = {
    getBloodStock,
    updateBloodStock,
    seedBloodStock,
    getAllDonations,
    getDonorDonations,
    updateDonation,
    deleteDonation,
    getBloodActivity
};
