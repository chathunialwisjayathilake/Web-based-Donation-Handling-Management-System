const FundDonation = require("../../models/FundDonation");
const { createAlert } = require("../alert/alert.controller");

const createFundDonation = async (req, res) => {
  try {
    const { donorId, amount, paymentSlipUrl, status } = req.body;

    if (!donorId || !amount) {
      return res.status(400).json({ message: "Donor ID and amount are required" });
    }

    const donation = await FundDonation.create({
      donorId,
      amount,
      paymentSlipUrl,
      status: status || "PENDING"
    });

    // Create an alert for the donation
    await createAlert({
      type: "SUCCESS",
      title: "New Fund Donation Recorded",
      message: `A donation of LKR ${amount.toLocaleString()} has been recorded.`,
      category: "FINANCE"
    });

    res.status(201).json(donation);
  } catch (error) {
    console.error("Error creating fund donation:", error);
    res.status(500).json({ message: "Error creating fund donation" });
  }
};

const getFundDonations = async (req, res) => {
  try {
    const donations = await FundDonation.find()
      .populate("donor")
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    console.error("Error fetching fund donations:", error);
    res.status(500).json({ message: "Error fetching fund donations" });
  }
};

const updateFundDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, status, paymentSlipUrl } = req.body;

    const donation = await FundDonation.findByIdAndUpdate(
      id,
      { amount, status, paymentSlipUrl },
      { new: true }
    ).populate("donor");

    if (!donation) {
      return res.status(404).json({ message: "Fund donation not found" });
    }

    res.json(donation);
  } catch (error) {
    console.error("Error updating fund donation:", error);
    res.status(500).json({ message: "Error updating fund donation" });
  }
};

module.exports = {
  createFundDonation,
  getFundDonations,
  updateFundDonation
};
