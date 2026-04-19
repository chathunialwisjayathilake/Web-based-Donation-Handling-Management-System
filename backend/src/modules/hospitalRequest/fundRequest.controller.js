const FundRequest = require("../../models/FundRequest");
const DonationHistory = require("../../models/DonationHistory");
const DonationNeed = require("../../models/DonationNeed");
const Hospital = require("../../models/Hospital");

const createFundRequest = async (req, res) => {
  try {
    const { hospitalId, amount, priority, description } = req.body;

    const request = await FundRequest.create({
      hospitalId,
      amount: parseFloat(amount),
      priority: priority || "ROUTINE",
      status: "PENDING"
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating fund request:", error);
    res.status(500).json({ message: "Failed to create fund request" });
  }
};

const updateFundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, priority, description } = req.body;
    console.log(`[Backend Debug] Updating FundRequest ${id}:`, { amount, priority });

    const existingRequest = await FundRequest.findById(id);
    if (!existingRequest) {
      console.log(`[Backend Debug] FundRequest ${id} not found`);
      return res.status(404).json({ message: "Request not found" });
    }

    if (existingRequest.status !== 'PENDING') {
      return res.status(403).json({ message: "Only PENDING requests can be edited." });
    }

    const updatedRequest = await FundRequest.findByIdAndUpdate(
      id,
      { amount: parseFloat(amount), priority, description },
      { new: true, runValidators: true }
    );

    console.log(`[Backend Debug] FundRequest ${id} updated result:`, updatedRequest.amount);
    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating fund request:", error);
    res.status(500).json({ message: "Failed to update fund request" });
  }
};

const getHospitalFundRequests = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const requests = await FundRequest.find({ hospitalId })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching fund requests:", error);
    res.status(500).json({ message: "Failed to fetch fund requests" });
  }
};

// For Fund Manager to see all
const getAllFundRequests = async (req, res) => {
  try {
    const requests = await FundRequest.find()
      .populate('hospitalId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching all fund requests:", error);
    res.status(500).json({ message: "Failed to fetch fund requests" });
  }
};

const updateFundRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedAmount } = req.body;

    const request = await FundRequest.findById(id).populate('hospitalId');
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const updateData = { status };
    if (approvedAmount !== undefined) {
      updateData.approvedAmount = parseFloat(approvedAmount);
    }

    const updated = await FundRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // RECORD HISTORY: Capital Grant Disbursement
    if (status === 'COMPLETED') {
      const finalApproved = parseFloat(approvedAmount || updated.amount);

      await DonationHistory.create({
        donorId: "65f0a1b2c3d4e5f6a7b8c9d0", // Central Foundation/Admin ID
        type: "FINANCE",
        subtype: 'TRANSFER',
        referenceId: id,
        hospitalId: updated.hospitalId?._id || updated.hospitalId,
        amount: finalApproved,
        details: `Received capital grant of LKR ${finalApproved.toLocaleString()} for: ${updated.description || 'Facility operations'}`
      });

      // If partially funded, create a public donation need (campaign) for the remaining balance
      const remaining = updated.amount - finalApproved;
      if (remaining > 0) {
        const hospitalName = request.hospitalId?.name || "Hospital";
        await DonationNeed.create({
          title: `Financial Support for ${hospitalName}`,
          itemName: "Funds",
          quantity: remaining.toString(),
          category: "FINANCE",
          description: `Remaining balance from direct grant. Hospital requested LKR ${updated.amount.toLocaleString()}, base capital covered LKR ${finalApproved.toLocaleString()}. Help us bridge the LKR ${remaining.toLocaleString()} gap.`,
          priority: updated.priority || 'URGENT',
          hospitalId: updated.hospitalId?._id || updated.hospitalId,
          hospitalRequestId: id,
          status: 'PENDING'
        });

        // NOTIFY DONORS: Fund campaign broadcast
        try {
          const { createDonorNotification } = require("../notification/notification.controller");
          await createDonorNotification({
            type: 'FUND_NEED',
            title: `Financial Support Needed: ${hospitalName}`,
            message: `Help bridge the LKR ${remaining.toLocaleString()} funding gap for ${hospitalName}.`
          });
        } catch (notifErr) {
          console.error("[Notification Error] Failed to notify donors:", notifErr);
        }
      }
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating fund request status:", error);
    res.status(500).json({ message: "Error updating fund request status" });
  }
};

const deleteFundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await FundRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(403).json({
        message: `Deletion denied. This request is already ${request.status} and cannot be removed.`
      });
    }

    await FundRequest.findByIdAndDelete(id);
    res.json({ message: "Financial aid request withdrawn" });
  } catch (error) {
    console.error("Error deleting fund request:", error);
    res.status(500).json({ message: "Error deleting fund request" });
  }
};

module.exports = {
  createFundRequest,
  updateFundRequest,
  getHospitalFundRequests,
  getAllFundRequests,
  updateFundRequestStatus,
  deleteFundRequest
};
