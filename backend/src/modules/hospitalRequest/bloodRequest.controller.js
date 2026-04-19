const mongoose = require("mongoose");
const BloodRequest = require("../../models/BloodRequest");
const BloodStock = require("../../models/BloodStock");
const DonationHistory = require("../../models/DonationHistory");
const Hospital = require("../../models/Hospital");

const createBloodRequest = async (req, res) => {
  try {
    const { hospitalId, bloodType, units, priority } = req.body;
    const numUnits = Number(units);

    if (isNaN(numUnits) || numUnits < 1) {
      return res.status(400).json({ message: "Request volume must be at least 1 pint" });
    }

    const request = await BloodRequest.create({
      hospitalId,
      bloodType,
      units: Number(units),
      priority: priority || "ROUTINE",
      status: "PENDING"
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating blood request:", error);
    res.status(500).json({ message: "Failed to create blood request" });
  }
};

const updateBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodType, units, priority, description } = req.body;
    console.log(`[Backend Debug] Updating BloodRequest ${id}:`, { bloodType, units, priority });

    const numUnits = Number(units);
    if (isNaN(numUnits) || numUnits < 1) {
      return res.status(400).json({ message: "Request volume must be at least 1 pint" });
    }

    const existingRequest = await BloodRequest.findById(id);
    if (!existingRequest) {
      console.log(`[Backend Debug] BloodRequest ${id} not found`);
      return res.status(404).json({ message: "Request not found" });
    }

    if (existingRequest.status !== 'PENDING') {
      return res.status(403).json({ message: "Only PENDING requests can be edited." });
    }

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      id,
      { bloodType, units: numUnits, priority, description },
      { new: true, runValidators: true }
    );

    console.log(`[Backend Debug] BloodRequest ${id} updated result:`, updatedRequest.units);
    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating blood request:", error);
    res.status(500).json({ message: "Failed to update blood request" });
  }
};

const getHospitalBloodRequests = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const requests = await BloodRequest.find({ hospitalId })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching blood requests:", error);
    res.status(500).json({ message: "Failed to fetch blood requests" });
  }
};

// For Blood Manager to see all
const getAllBloodRequests = async (req, res) => {
    try {
      const requests = await BloodRequest.find()
        .populate('hospitalId')
        .sort({ createdAt: -1 });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching all blood requests:", error);
      res.status(500).json({ message: "Failed to fetch blood requests" });
    }
};

const updateBloodRequestStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      const request = await BloodRequest.findById(id);
      if (!request) return res.status(404).json({ message: "Request not found" });

      // If approving, check and deduct stock
      if (status === 'COMPLETED' && request.status !== 'COMPLETED') {
          const stock = await BloodStock.findOne({ bloodType: request.bloodType });
          if (!stock || stock.units < request.units) {
              return res.status(400).json({ message: `Insufficient stock for ${request.bloodType}` });
          }
          await BloodStock.findOneAndUpdate(
              { bloodType: request.bloodType },
              { $inc: { units: -request.units } }
          );

          // RECORD HISTORY: Blood Transfer from central repository
          await DonationHistory.create({
              donorId: "65f0a1b2c3d4e5f6a7b8c9d0", // System/Internal Inventory ID
              type: "BLOOD",
              subtype: 'TRANSFER',
              referenceId: id,
              hospitalId: request.hospitalId,
              quantity: request.units,
              bloodType: request.bloodType,
              details: `Manual fulfillment approved: ${request.units} pints of ${request.bloodType} dispatched to hospital coordination.`
          });
      }
  
      const updated = await BloodRequest.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
  
      res.json(updated);
    } catch (error) {
      console.error("Error updating blood request status:", error);
      res.status(500).json({ message: "Error updating blood request status" });
    }
};

const getBloodStock = async (req, res) => {
    try {
        const stocks = await BloodStock.find();
        res.json(stocks);
    } catch (err) {
        res.status(500).json({ message: "Error fetching blood stock" });
    }
};

const updateBloodStock = async (req, res) => {
    try {
        const { bloodType, units } = req.body;
        const numUnits = Number(units);
        
        if (numUnits < 0) {
            return res.status(400).json({ message: "Stock level cannot be negative" });
        }

        const updated = await BloodStock.findOneAndUpdate(
            { bloodType },
            { units: numUnits, lastUpdated: new Date() },
            { upsert: true, new: true }
        );

        // AUDIT LOG: Record manual stewardship revision
        // Try to identify a system hospital if possible
        const systemHospital = await Hospital.findOne();

        await DonationHistory.create({
            donorId: "65f0a1b2c3d4e5f6a7b8c9d0", // System Admin ID
            type: "BLOOD",
            subtype: 'REVISION',
            referenceId: updated._id,
            hospitalId: systemHospital?._id,
            quantity: numUnits,
            bloodType: bloodType,
            details: `Manual stewardship revision: Stock level for ${bloodType} adjusted to ${numUnits} pints.`
        });

        res.json(updated);
    } catch (err) {
        console.error("Error updating manual stock:", err);
        res.status(500).json({ message: "Error updating blood stock", error: err.message });
    }
};

const deleteBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(403).json({ 
        message: `Deletion denied. This request is already ${request.status} and cannot be removed.` 
      });
    }

    await BloodRequest.findByIdAndDelete(id);
    res.json({ message: "Request removed from coordination ledger" });
  } catch (error) {
    console.error("Error deleting blood request:", error);
    res.status(500).json({ message: "Error deleting blood request" });
  }
};

const dispatchBlood = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const dispatchQty = Number(quantity);
        
        console.log(`[DispatchBlood] START - ID: ${id}, Qty: ${dispatchQty}`);

        const request = await BloodRequest.findById(id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        const bloodType = request.bloodType;
        const stock = await BloodStock.findOne({ bloodType });

        if (!stock || stock.units < dispatchQty) {
            return res.status(400).json({ 
                message: `Insufficient stock for ${bloodType}. Available: ${stock?.units || 0}` 
            });
        }

        // 1. Deduct from stock
        await BloodStock.findOneAndUpdate(
            { bloodType },
            { $inc: { units: -dispatchQty } }
        );

        // 2. Update request
        const newDispatched = (request.dispatchedUnits || 0) + dispatchQty;
        const isFullyMet = newDispatched >= request.units;
        
        const updated = await BloodRequest.findByIdAndUpdate(
            id,
            { 
                dispatchedUnits: newDispatched,
                status: isFullyMet ? 'COMPLETED' : 'PARTIAL'
            },
            { new: true }
        );

        // 3. Record History
        await DonationHistory.create({
            donorId: "65f0a1b2c3d4e5f6a7b8c9d0", // System Inventory ID
            type: "BLOOD",
            subtype: 'TRANSFER',
            referenceId: id,
            hospitalId: request.hospitalId,
            quantity: dispatchQty,
            bloodType: bloodType,
            details: `Stewardship Dispatch: ${dispatchQty} pints of ${bloodType} transferred to ${request.hospitalId}. (${newDispatched}/${request.units} total fulfilled)`
        });

        res.json(updated);
    } catch (error) {
        console.error("Error dispatching blood:", error);
        res.status(500).json({ message: "Error dispatching blood" });
    }
};

module.exports = {
  createBloodRequest,
  updateBloodRequest,
  getHospitalBloodRequests,
  getAllBloodRequests,
  updateBloodRequestStatus,
  dispatchBlood,
  getBloodStock,
  updateBloodStock,
  deleteBloodRequest
};
