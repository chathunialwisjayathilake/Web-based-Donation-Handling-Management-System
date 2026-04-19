const ItemRequest = require("../../models/ItemRequest");
const BloodRequest = require("../../models/BloodRequest");
const FundRequest = require("../../models/FundRequest");
const Item = require("../../models/Item");
const DonationNeed = require("../../models/DonationNeed");
const ItemDonation = require("../../models/ItemDonation");
const BloodDonation = require("../../models/BloodDonation");
const DonationHistory = require("../../models/DonationHistory");
const Hospital = require("../../models/Hospital");
const Donor = require("../../models/Donor");
const { User } = require("../../models/User");
const mongoose = require('mongoose');
const { RequestStatus, Priority } = require("../../models/Constants");
const { createAlert } = require("../alert/alert.controller");
const BloodStock = require("../../models/BloodStock");
const validatePhone = (phone) => {
  if (!phone) return true;
  const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const getHospitalRequests = async (req, res) => {
  try {
    const requests = await ItemRequest.find()
      .populate('hospital')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching hospital requests:", error);
    res.status(500).json({ message: "Error fetching hospital requests" });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedRequest = await ItemRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Error updating request status" });
  }
};

const createItemRequest = async (req, res) => {
  try {
    const { hospitalId, itemName, quantity, priority } = req.body;

    const request = await ItemRequest.create({
      hospitalId,
      itemName,
      quantity,
      priority: priority || "ROUTINE",
      status: "PENDING"
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating item request:", error);
    res.status(500).json({ message: "Failed to create item request" });
  }
};

const updateItemRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, quantity, priority } = req.body;

    const existingRequest = await ItemRequest.findById(id);
    if (!existingRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (existingRequest.status !== 'PENDING') {
      return res.status(403).json({ message: "Only PENDING requests can be edited." });
    }

    const updatedRequest = await ItemRequest.findByIdAndUpdate(
      id,
      { itemName, quantity, priority },
      { new: true }
    );

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating item request:", error);
    res.status(500).json({ message: "Failed to update item request" });
  }
};

const getRequestsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const requests = await ItemRequest.find({ hospitalId })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching hospital requests:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

const fulfillItemRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { transferQty, transferQuantity, broadcastTitle, broadcastDescription, broadcastImage } = req.body;

    // SIGNAL TOLERANCE: Support both naming conventions from frontend
    const finalTransferQty = parseInt(transferQty || transferQuantity || 0);

    const request = await ItemRequest.findById(id).populate('hospital');

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    console.log(`[Fulfill Logic] Processing ${request.itemName} for ${request.hospital.name}. Transferring: ${finalTransferQty}`);

    // Find inventory item
    const item = await Item.findOne({ itemName: request.itemName });

    if (item) {
      const currentStock = parseInt(item.quantity) || 0;
      const newStock = Math.max(0, currentStock - finalTransferQty);

      await Item.findByIdAndUpdate(item._id, { quantity: String(newStock) });
    }

    // Update Request Status
    await ItemRequest.findByIdAndUpdate(id, { status: "COMPLETED" });

    // Handle Deficit (Broadcast to Donors)
    const rawQty = request.quantity.replace(/[^0-9]/g, '');
    const requestedQty = parseInt(rawQty) || 0;
    const deficit = requestedQty - finalTransferQty;

    console.log(`[Fulfill Logic] requested: ${requestedQty}, transfer: ${finalTransferQty}, deficit: ${deficit}`);

    if (deficit > 0) {
      const needDescription = broadcastDescription || `Critical requirement for ${request.itemName} reported by ${request.hospital.name}. This deficit of ${deficit} units needs immediate fulfillment to maintain hospital operations.`;

      try {
        const need = await DonationNeed.create({
          title: broadcastTitle || `Urgent: ${request.itemName} for ${request.hospital.name}`,
          itemName: request.itemName,
          quantity: String(deficit),
          priority: request.priority,
          description: needDescription,
          imageUrl: broadcastImage,
          hospitalRequestId: request._id,
          hospitalId: request.hospitalId,
          category: 'ITEM',
          status: "PENDING"
        });
        console.log(`[Fulfill Success] Broadcast created: ${need._id} with deficit ${deficit}`);

        // Trigger Alert
        await createAlert({
          type: "URGENT",
          title: broadcastTitle || "New Hospital Asset Need",
          message: `A deficit of ${deficit} units for "${request.itemName}" has been publicized for donor fulfillment.`,
          category: "DONATION"
        });

        // NOTIFY DONORS: Broadcast notification for urgent need
        try {
          const { createDonorNotification } = require("../notification/notification.controller");
          await createDonorNotification({
            type: 'URGENT',
            title: `Urgent: ${request.itemName} needed for ${request.hospital.name}`,
            message: needDescription
          });
        } catch (notifErr) {
          console.error("[Notification Error] Failed to notify donors:", notifErr);
        }
      } catch (err) {
        console.error('[Fulfill Critical] Error creating broadcast need:', err);
      }
    }

    // RECORD HISTORY: Initial Allocation from Inventory
    if (parseInt(transferQuantity) > 0) {
      await DonationHistory.create({
        donorId: "65f0a1b2c3d4e5f6a7b8c9d0", // System/Internal Inventory ID Placeholder
        type: "ITEM",
        subtype: 'TRANSFER',
        referenceId: request._id,
        hospitalId: request.hospitalId?._id || request.hospitalId,
        quantity: parseInt(transferQuantity),
        details: `Allocated ${transferQuantity} units of ${request.itemName} from central inventory.`
      });
    }

    res.json({ message: "Fulfillment processed successfully", deficit });
  } catch (error) {
    console.error("Error fulfilling request:", error);
    res.status(500).json({ message: "Error fulfilling request" });
  }
};

const donateToNeed = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, donorId, deliveryMethod, paymentMethod, cardNumber, bankName, imageUrl } = req.body;

    const need = await DonationNeed.findById(id);
    if (!need) return res.status(404).json({ message: "Broadcast not found" });

    let actualDonorId = null;
    if (donorId) {
      const Donor = require('../../models/Donor');
      let donorDoc = await Donor.findOne({ userId: donorId });

      if (!donorDoc) {
        const { User } = require('../../models/User');
        const userObj = await User.findById(donorId);
        if (userObj) {
          donorDoc = await Donor.create({
            userId: userObj._id,
            name: userObj.username || userObj.email.split('@')[0],
            phone: userObj.phone || "000000000"
          });
        }
      }
      if (donorDoc) actualDonorId = donorDoc._id;
    }

    const isCard = paymentMethod === 'CARD';
    const donation = new ItemDonation({
      donorId: actualDonorId || "65f0a1b2c3d4e5f6a7b8c9d1",
      campaignId: need._id,
      itemName: need.itemName || need.title || 'Donation',
      quantity: String(amount),
      category: need.category || 'ITEM',
      status: isCard ? 'APPROVED' : 'PENDING',
      deliveryMethod: deliveryMethod || null,
      paymentMethod: paymentMethod || 'NONE',
      cardNumber: cardNumber || undefined,
      bankName: bankName || undefined,
      imageUrl: imageUrl || undefined
    });

    await donation.save();

    // IF CARD: AUTO-SETTLE AND SYNC CAMPAIGN
    if (isCard) {
      const currentDonated = parseInt(need.donatedQuantity) || 0;
      const targetQty = parseInt(need.quantity) || 1;
      const newTotal = currentDonated + parseInt(amount);

      const updateData = { donatedQuantity: String(newTotal) };
      if (newTotal >= targetQty) updateData.status = 'COMPLETED';

      await DonationNeed.findByIdAndUpdate(need._id, updateData);
    }

    res.json({
      message: isCard ? "Payment processed successfully." : "Donation slip submitted for verification.",
      donation
    });
  } catch (error) {
    console.error("Error processing donation:", error);
    res.status(500).json({ message: "Internal payment processing failure" });
  }
};

const getDonationsForNeed = async (req, res) => {
  try {
    const { id } = req.params;
    const donations = await ItemDonation.find({ campaignId: id })
      .populate('donor', 'name phone')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error("Error fetching donations for need:", error);
    res.status(500).json({ message: "Error fetching donor items" });
  }
};

const updateDonationStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { status } = req.body;

    const donation = await ItemDonation.findById(donationId);
    if (!donation) return res.status(404).json({ message: "Donation record not found" });

    // If changing to APPROVED from not-approved
    if (status === 'APPROVED' && donation.status !== 'APPROVED') {
      const need = await DonationNeed.findById(donation.campaignId);
      if (need) {
        const currentDonated = parseInt(need.donatedQuantity) || 0;
        await DonationNeed.findByIdAndUpdate(need._id, {
          donatedQuantity: String(currentDonated + parseInt(donation.quantity))
        });
      }
    }
    // If revoking an APPROVED status
    else if (donation.status === 'APPROVED' && status !== 'APPROVED') {
      const need = await DonationNeed.findById(donation.campaignId);
      if (need) {
        const currentDonated = parseInt(need.donatedQuantity) || 0;
        const newTotal = Math.max(0, currentDonated - parseInt(donation.quantity));
        await DonationNeed.findByIdAndUpdate(need._id, {
          donatedQuantity: String(newTotal)
        });
      }
    }

    donation.status = status;
    await donation.save();

    res.json({ message: "Donation status updated successfully", donation });
  } catch (error) {
    console.error("Error updating donation status:", error);
    res.status(500).json({ message: "Error updating donation status" });
  }
};

const transferNeedStock = async (req, res) => {
  try {
    const { id } = req.params;
    const need = await DonationNeed.findById(id);

    if (!need) {
      return res.status(404).json({ message: "Donation broadcast not found" });
    }

    const available = parseInt(need.donatedQuantity) || 0;
    if (available <= 0) return res.status(400).json({ message: "No stock available for transfer" });

    // Resolve Hospital ID
    let hId = need.hospitalId;
    if (!hId && need.hospitalRequestId) {
      const itemReq = await ItemRequest.findById(need.hospitalRequestId);
      if (itemReq) hId = itemReq.hospitalId;
    }

    // NEW: Auto-resolve directly to the Hospital Manager's hospital
    if (!hId) {
      const Hospital = require("../../models/Hospital");
      const { User } = require("../../models/User");

      // Find the designated hospital manager account
      const managerUser = await User.findOne({ role: "HOSPITAL_MANAGER" });
      if (managerUser) {
        // Find the hospital linked to this specific manager
        const managerHospital = await Hospital.findOne({ userId: managerUser._id });
        if (managerHospital) {
          hId = managerHospital._id;
          console.log(`[TRANSFER DEBUG] Directed exactly to manager's hospital: ${managerHospital.name} (${hId})`);
        }
      }

      // Fallback safely if somehow the manager isn't linked
      if (!hId) {
        const fallback = await Hospital.findOne().sort({ createdAt: 1 });
        if (fallback) hId = fallback._id;
      }
    }

    const finalHospitalId = hId?._id || hId;
    console.log(`[TRANSFER DEBUG] Final Hospital ID for history: ${finalHospitalId}`);

    if (!finalHospitalId || !mongoose.Types.ObjectId.isValid(String(finalHospitalId))) {
      console.warn(`[Transfer Failed] Invalid or missing Hospital ID: ${finalHospitalId}`);
      return res.status(400).json({ message: "No active hospitals found in system to receive transfer." });
    }

    // Deduct donated stock and move to pending transit
    const pendingTransferred = parseInt(need.pendingTransferQuantity) || 0;
    await DonationNeed.findByIdAndUpdate(id, {
      donatedQuantity: "0",
      pendingTransferQuantity: String(pendingTransferred + available)
    });

    const unitLabel = need.category === 'FINANCE' ? 'LKR' : (need.category === 'BLOOD' ? 'pints' : 'units');
    const history = await DonationHistory.create({
      donorId: "65f0a1b2c3d4e5f6a7b8c9d1",
      type: need.category || "ITEM",
      subtype: 'TRANSFER',
      status: 'PENDING',
      broadcastId: need._id,
      referenceId: need.hospitalRequestId || need._id,
      hospitalId: hId?._id || hId,
      quantity: (need.category === 'ITEM' || need.category === 'BLOOD') ? available : 0,
      amount: need.category === 'FINANCE' ? available : 0,
      details: `Received ${available} ${unitLabel} of ${need.itemName} from community donors via broadcast fulfillment.`
    });

    console.log(`[Transfer Success] Created PENDING history ${history._id} for hospital ${hId}`);
    res.json({ message: `Successfully transferred ${available} ${unitLabel}. Awaiting hospital confirmation.` });
  } catch (error) {
    console.error("Error transferring need stock:", error);
    res.status(500).json({ message: "Internal server error during transfer" });
  }
};

const getHospitalDonationHistory = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    console.log(`[HISTORY DEBUG] Fetching history for Hospital ID: ${hospitalId}`);
    const history = await DonationHistory.find({ hospitalId })
      .sort({ createdAt: -1 });
    console.log(`[HISTORY DEBUG] Found ${history.length} records`);
    res.json(history);
  } catch (error) {
    console.error("Error fetching hospital history:", error);
    res.status(500).json({ message: "Error fetching hospital history" });
  }
};

const getPublicDonationNeeds = async (req, res) => {
  try {
    const { status, category, donorId, limit } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      // Default to PENDING if no status is specified
      query.status = "PENDING";
    }

    if (category) {
      const categories = category.split(',').map(c => c.trim().toUpperCase());
      query.category = { $in: categories };
    }

    let queryBuilder = DonationNeed.find(query).sort({ createdAt: -1 });

    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit, 10));
    }

    const rawNeeds = await queryBuilder;

    // Convert to plain objects with id field
    const needs = rawNeeds.map(n => {
      const obj = n.toJSON();
      obj.id = String(n._id);
      obj._id = String(n._id);
      return obj;
    });

    // Augment metadata based on campaign category
    for (let need of needs) {
      try {
        if (need.category === 'BLOOD') {
          need.registeredDonorsCount = await BloodDonation.countDocuments({ campaignId: need._id });
          if (donorId) {
            const existingReg = await BloodDonation.findOne({ campaignId: need._id, donorId });
            need.donorHasRegistered = !!existingReg;
            if (existingReg) {
              need.donorTimeSlot = existingReg.timeSlot;
            }
          }
        } else {
          // Default to ITEM donation counts
          const pendingCount = await ItemDonation.countDocuments({ campaignId: need._id, status: 'PENDING' });
          need.pendingDonationsCount = pendingCount;
          need.hasPendingDonations = pendingCount > 0;
        }
      } catch (e) {
        console.warn(`[DonationNeeds] Skipped metadata augmentation for ${need._id}:`, e.message);
        need.registeredDonorsCount = 0;
        need.pendingDonationsCount = 0;
        need.hasPendingDonations = false;
      }
    }

    res.json(needs);
  } catch (error) {
    console.error("Error fetching donation needs:", error);
    res.status(500).json({ message: "Error fetching donation needs" });
  }
};

const updateDonationNeed = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, itemName, quantity, priority, description, imageUrl, status, category, location, contact, date, startTime, endTime, hospitalId, hospitalRequestId } = req.body;

    // HANDSHAKE SANITIZER: Prevent CastError by nullifying empty strings for ObjectIds
    if (!hospitalId || hospitalId === '') hospitalId = undefined;
    if (!hospitalRequestId || hospitalRequestId === '') hospitalRequestId = undefined;

    if (contact && !validatePhone(contact)) {
      return res.status(400).json({ message: "Invalid contact number format" });
    }

    const updateData = { title, itemName, quantity, priority, description, imageUrl, status, category, location, contact, date, startTime, endTime, hospitalId, hospitalRequestId };

    // Remove undefined fields to avoid overwriting with null/undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updated = await DonationNeed.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      console.error(`[Coordination Error] Campaign not found for ID: ${id}`);
      return res.status(404).json({ message: "Campaign broadcast not found. It may have been curated by another lead." });
    }

    if (title && imageUrl) {
      // TRIGGER ALERT: Curation Published
      try {
        await createAlert({
          type: "SUCCESS",
          title: "Broadcast Curated",
          message: `The request for "${updated.itemName}" has been professionally curated and published to the homepage.`,
          category: "DONATION"
        });
      } catch (alertError) {
        console.error("[Alert Error] Failed to trigger coordination alert:", alertError);
        // Don't fail the update if alert fails, but log it
      }
    }

    res.json(updated);
  } catch (error) {
    console.error(`[Coordination Failure] Handshake error for ID ${req.params.id}:`, {
      error: error.message,
      stack: error.stack,
      payload: req.body
    });
    res.status(500).json({ message: `Coordination Failure (500): ${error.message}` });
  }
};

const deleteDonationNeed = async (req, res) => {
  try {
    const { id } = req.params;
    await DonationNeed.findByIdAndDelete(id);
    res.json({ message: "Donation need removed successfully" });
  } catch (error) {
    console.error("Error deleting donation need:", error);
    res.status(500).json({ message: "Error deleting donation need" });
  }
};


const createDonationNeed = async (req, res) => {
  try {
    let { title, itemName, quantity, priority, description, imageUrl, category, location, contact, date, startTime, endTime, hospitalRequestId, hospitalId } = req.body;

    // HANDSHAKE SANITIZER: Prevent CastError by nullifying empty strings for ObjectIds
    if (!hospitalId || hospitalId === '') hospitalId = undefined;
    if (!hospitalRequestId || hospitalRequestId === '') hospitalRequestId = undefined;

    if (contact && !validatePhone(contact)) {
      return res.status(400).json({ message: "Please provide a valid contact number (e.g. 0712345678)" });
    }

    const need = await DonationNeed.create({
      title,
      itemName,
      quantity,
      priority: priority || "ROUTINE",
      description,
      imageUrl,
      category: category || "GENERAL",
      location,
      contact,
      date,
      startTime,
      endTime,
      hospitalRequestId,
      hospitalId: hospitalId || undefined,
      status: "PENDING"
    });

    // NOTIFY DONORS: Create a broadcast notification
    try {
      const { createDonorNotification } = require("../notification/notification.controller");
      const categoryLabel = (category || "GENERAL").toLowerCase();
      await createDonorNotification({
        type: category === 'BLOOD' ? 'BLOOD_DRIVE' : category === 'FINANCE' ? 'FUND_NEED' : 'CAMPAIGN',
        title: `New ${categoryLabel} campaign: ${title || itemName}`,
        message: description || `A new ${categoryLabel} campaign has been created. Your support is needed!`
      });
    } catch (notifErr) {
      console.error("[Notification Error] Failed to notify donors:", notifErr);
    }

    res.status(201).json(need);
  } catch (error) {
    console.error("Error creating donation need:", error);
    res.status(500).json({ message: "Failed to create donation need" });
  }
};

const deleteItemRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ItemRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(403).json({
        message: `Deletion denied. This request is already ${request.status} and cannot be removed.`
      });
    }

    await ItemRequest.findByIdAndDelete(id);
    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error("Error deleting item request:", error);
    res.status(500).json({ message: "Error deleting request" });
  }
};

const registerForCampaign = async (req, res) => {
  try {
    const { id } = req.params; // campaignId
    const { donorId, bloodType, date, timeSlot } = req.body;

    if (!donorId || !bloodType) {
      return res.status(400).json({ message: "Donor ID and Blood Type are required for registration" });
    }

    // Resolve donorId: If it's a User ID, find the corresponding Donor record
    const donorRecord = await Donor.findOne({
      $or: [
        { _id: donorId },
        { userId: donorId }
      ]
    });

    if (!donorRecord) {
      return res.status(404).json({ message: "No donor profile found for this account" });
    }

    const resolvedDonorId = donorRecord._id;

    // Prevent multiple registrations from the same donor for the same campaign
    const existingRegistration = await BloodDonation.findOne({ donorId: resolvedDonorId, campaignId: id });
    if (existingRegistration) {
      const campaign = await DonationNeed.findById(id);
      return res.status(400).json({ message: `You are already registered for "${campaign?.title || 'this campaign'}"` });
    }

    const registration = new BloodDonation({
      donorId: resolvedDonorId,
      campaignId: id,
      bloodType,
      date: date || new Date(),
      timeSlot: timeSlot || "Flexible",
      status: RequestStatus.PENDING
    });

    await registration.save();
    res.status(201).json({
      message: "Successfully registered for campaign",
      registration
    });
  } catch (error) {
    console.error("Error registering for campaign:", error);
    res.status(500).json({ message: "Failed to register for campaign" });
  }
};

const getRegistrationsForCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const registrations = await BloodDonation.find({ campaignId: id })
      .populate('donor', 'name phone')
      .sort({ date: 1, timeSlot: 1 });

    res.json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};

const bookBlood = async (req, res) => {
  try {
    const { donorId, hospitalId, bloodType, date, timeSlot } = req.body;

    if (!donorId || !hospitalId || !bloodType) {
      return res.status(400).json({ message: "Donor ID, Hospital ID, and Blood Type are required" });
    }

    // Resolve donorId
    const donorRecord = await Donor.findOne({
      $or: [
        { _id: donorId },
        { userId: donorId }
      ]
    });

    if (!donorRecord) {
      return res.status(404).json({ message: "No donor profile found" });
    }

    const registration = new BloodDonation({
      donorId: donorRecord._id,
      hospitalId,
      bloodType,
      date: date || new Date(),
      timeSlot: timeSlot || "Flexible",
      status: RequestStatus.PENDING
    });

    await registration.save();
    res.status(201).json({
      message: "Successfully booked blood donation",
      registration
    });
  } catch (error) {
    console.error("Error booking blood donation:", error);
    res.status(500).json({ message: "Failed to book blood donation" });
  }
};

const updateBloodRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pintsDonated } = req.body;

    // 1. Deep-Path Identity Trace
    const registration = await BloodDonation.findById(id)
      .populate('donorId')
      .populate({
        path: 'campaignId',
        populate: { path: 'hospitalRequestId' }
      });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const oldStatus = registration.status;
    registration.status = status;

    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      const volume = parseFloat(pintsDonated) || 1.0;
      registration.pintsDonated = volume;

      // 2. Atomic Inventory Injection (using 'units' field)
      // 3. Autonomous Identifier Extraction
      const refId = registration._id || id;
      let hospId = registration.hospitalId ||
        registration.campaignId?.hospitalId ||
        registration.campaignId?.hospitalRequestId?.hospitalId;

      // Emergency Safety Handshake: Prevent ledger crash if IDs are missing
      if (!hospId) {
        console.warn("Logistics metadata incomplete. Using emergency facility fallback for ledger.");
        const fallbackHospital = await Hospital.findOne();
        hospId = fallbackHospital?._id;
      }

      if (!hospId) {
        console.error("Critical Failure: No medical facility found for stewardship record.");
        throw new Error("Audit ledger requirement not met: No hospital found.");
      }

      const donorName = registration.donorId?.name || "Anonymous";
      const campaignTitle = registration.campaignId?.title || "Campaign Drive";

      // 5. Capacity Audit: Prevent collection overflow
      if (registration.campaignId) {
        const campaign = await DonationNeed.findById(registration.campaignId._id || registration.campaignId);
        if (campaign) {
          const targetQty = parseFloat(campaign.quantity || "0");
          const currentDonated = parseFloat(campaign.donatedQuantity || "0");
          const remaining = targetQty - currentDonated;

          if (volume > remaining) {
            return res.status(400).json({
              message: `Collection Overflow: Only ${remaining.toFixed(2)} pints remaining in this campaign target (${targetQty} total).`
            });
          }

          // Atomic Progress Synchronization
          campaign.donatedQuantity = (currentDonated + volume).toString();
          await campaign.save();
          console.log(`[Stewardship Progress] Campaign '${campaign.title}' updated: ${campaign.donatedQuantity} pints total.`);
        }
      }

      // 4. Final Stewardship Ledger Injection
      await DonationHistory.create({
        donorId: registration.donorId?._id,
        type: 'BLOOD',
        subtype: 'DONATION',
        referenceId: refId,
        hospitalId: hospId,
        quantity: volume,
        bloodType: registration.bloodType,
        details: `Stewardship Drive: ${campaignTitle} | Donor: ${donorName}`,
        status: 'SUCCESSFUL',
        date: new Date()
      });
    }

    await registration.save();
    res.json(registration);
  } catch (error) {
    console.error("Error updating registration status:", error);
    res.status(500).json({ message: "Failed to update registry and inventory" });
  }
};

const updateHistoryStatus = async (req, res) => {
  try {
    const { historyId } = req.params;
    const { status } = req.body; // 'SUCCESSFUL' or 'FAILED'

    const DonationHistory = require('../../models/DonationHistory');
    const history = await DonationHistory.findById(historyId);
    if (!history) return res.status(404).json({ message: "History record not found" });

    if (history.status !== 'PENDING') {
      return res.status(400).json({ message: "Record status is already finalized." });
    }

    // Capture original values
    const qty = parseInt(history.quantity) || 0;
    const amt = parseFloat(history.amount) || 0;
    const value = history.type === 'FINANCE' ? amt : qty;

    if (status === 'SUCCESSFUL') {
      // 1. Update DonationNeed if broadcastId exists
      if (history.broadcastId) {
        const need = await DonationNeed.findById(history.broadcastId);
        if (need) {
          const currentTransferred = parseInt(need.transferredQuantity) || 0;
          const currentPending = parseInt(need.pendingTransferQuantity) || 0;

          const newTransferred = currentTransferred + value;
          const newPending = Math.max(0, currentPending - value);
          const targetQty = parseInt(need.quantity) || 1;

          const updateData = {
            transferredQuantity: String(newTransferred),
            pendingTransferQuantity: String(newPending)
          };

          if (newTransferred >= targetQty) {
            updateData.status = 'COMPLETED';
          }

          await DonationNeed.findByIdAndUpdate(need._id, updateData);
        }
      }
      history.status = 'SUCCESSFUL';
    } else if (status === 'FAILED') {
      // 1. Return items to the 'Donated' pool of the broadcast
      if (history.broadcastId) {
        const need = await DonationNeed.findById(history.broadcastId);
        if (need) {
          const currentDonated = parseInt(need.donatedQuantity) || 0;
          const currentPending = parseInt(need.pendingTransferQuantity) || 0;

          await DonationNeed.findByIdAndUpdate(need._id, {
            donatedQuantity: String(currentDonated + value),
            pendingTransferQuantity: String(Math.max(0, currentPending - value))
          });
        }
      }
      history.status = 'FAILED';
    }

    await history.save();
    res.json({ message: `Asset fulfillment marked as ${status}.`, history });
  } catch (error) {
    console.error("Error updating history status:", error);
    res.status(500).json({ message: "Error updating fulfillment status" });
  }
};

const getAllDonations = async (req, res) => {
  try {
    const donations = await ItemDonation.find()
      .populate('donor', 'name phone')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    console.error("Error fetching all donations:", error);
    res.status(500).json({ message: "Error fetching community contribution ledger" });
  }
};

module.exports = {
  getHospitalRequests,
  updateRequestStatus,
  createItemRequest,
  getRequestsByHospital,
  fulfillItemRequest,
  getPublicDonationNeeds,
  updateDonationNeed,
  deleteDonationNeed,
  donateToNeed,
  getDonationsForNeed,
  getAllDonations,
  updateDonationStatus,
  transferNeedStock,
  createDonationNeed,
  deleteItemRequest,
  getHospitalDonationHistory,
  registerForCampaign,
  getRegistrationsForCampaign,
  updateBloodRegistrationStatus,
  updateHistoryStatus,
  bookBlood,
  updateItemRequest
};
