const Donor = require("../../models/Donor");
const BloodDonation = require("../../models/BloodDonation");
const FundDonation = require("../../models/FundDonation");
const ItemDonation = require("../../models/ItemDonation");
const DonationHistory = require("../../models/DonationHistory");

const searchDonors = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const donors = await Donor.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ]
    }).limit(10);

    res.json(donors);
  } catch (error) {
    console.error("Error searching donors:", error);
    res.status(500).json({ message: "Error searching donors" });
  }
};

const getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });

    // Enrich donors with real engagement scores and blood types
    const enrichedDonors = await Promise.all(donors.map(async (donor) => {
      const historyCount = await DonationHistory.countDocuments({ donorId: donor._id });
      const bloodCount = await BloodDonation.countDocuments({ donorId: donor._id });
      const itemCount = await ItemDonation.countDocuments({ donorId: donor._id });

      // Find latest blood type if missing from profile
      let bloodType = donor.bloodType;
      if (!bloodType) {
        const latestBlood = await BloodDonation.findOne({ donorId: donor._id })
          .sort({ createdAt: -1 });
        if (latestBlood) bloodType = latestBlood.bloodType;
      }

      // Base score for registration, +25% per activity, cap at 100
      const totalActivity = historyCount + bloodCount + itemCount;
      const score = Math.min(100, 5 + (totalActivity * 25));

      const donorObj = donor.toObject();
      donorObj.engagementScore = score;
      donorObj.bloodType = bloodType || 'N/A';
      return donorObj;
    }));

    res.json(enrichedDonors);
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({ message: "Error fetching donors" });
  }
};

const getDonorFullDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const donor = await Donor.findById(id)
      .populate('bloodDonations')
      .populate('fundDonations')
      .populate('itemDonations')
      .populate('history');

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.json(donor);
  } catch (error) {
    console.error("Error fetching donor details:", error);
    res.status(500).json({ message: "Error fetching donor details" });
  }
};

const updateDonor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.phone) {
      const hasPlus = updateData.phone.startsWith('+');
      const digits = updateData.phone.replace(/\D/g, '');
      if (digits.length > 11) {
        return res.status(400).json({ message: "Phone number cannot exceed 11 digits" });
      }
      updateData.phone = (hasPlus ? '+' : '') + digits;
    }

    const updatedDonor = await Donor.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedDonor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.json(updatedDonor);
  } catch (error) {
    console.error("Error updating donor:", error);
    res.status(500).json({ message: "Error updating donor" });
  }
};

const deleteDonor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDonor = await Donor.findByIdAndDelete(id);

    if (!deletedDonor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.json({ message: "Donor removed successfully" });
  } catch (error) {
    console.error("Error deleting donor:", error);
    res.status(500).json({ message: "Error deleting donor" });
  }
};

const getGlobalStats = async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments();

    // Total blood units from all successful donations
    const bloodDonations = await BloodDonation.find({ status: 'APPROVED' });
    const totalBloodUnits = bloodDonations.length;

    // Total funds calculated from settled history
    const historyFunds = await DonationHistory.find({
      type: 'FINANCE',
      status: 'SUCCESSFUL'
    });
    const totalFunds = historyFunds.reduce((acc, h) => acc + (h.amount || 0), 0);

    // Active campaigns and Top 2 by progress
    const DonationNeed = require("../../models/DonationNeed");
    const activeCampaigns = await DonationNeed.countDocuments({ status: 'PENDING' });
    const topCampaigns = await DonationNeed.find({ status: 'PENDING' })
      .sort({ donatedQuantity: -1 })
      .limit(2);

    // Recent Activity Log (Latest 5 from History and Blood Registrations)
    const recentHistory = await DonationHistory.find()
      .populate('donorId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBlood = await BloodDonation.find()
      .populate('donorId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivity = [
      ...recentHistory.map(h => ({
        id: h._id,
        type: h.type === 'FINANCE' ? 'Fund Contribution' : 'Item Donation',
        donor: h.donorId?.name || 'Anonymous',
        details: h.details,
        createdAt: h.createdAt
      })),
      ...recentBlood.map(b => ({
        id: b._id,
        type: 'Blood Registration',
        donor: b.donorId?.name || 'Anonymous',
        details: `Registered for a blood drive (${b.bloodType})`,
        createdAt: b.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    res.json({
      totalDonors,
      totalBloodUnits,
      totalFunds,
      activeCampaigns,
      topCampaigns,
      recentActivity
    });
  } catch (error) {
    console.error("Error fetching global stats:", error);
    res.status(500).json({ message: "Error fetching global stats" });
  }
};

module.exports = {
  searchDonors,
  getAllDonors,
  getDonorFullDetails,
  updateDonor,
  deleteDonor,
  getGlobalStats
};
