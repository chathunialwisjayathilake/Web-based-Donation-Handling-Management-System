const express = require("express");
const router = express.Router();

const { 
  getHospitalRequests, 
  updateRequestStatus, 
  createItemRequest,
  updateItemRequest,
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
  getHospitalDonationHistory,
  createDonationNeed,
  deleteItemRequest,
  registerForCampaign,
  getRegistrationsForCampaign,
  updateBloodRegistrationStatus,
  updateHistoryStatus,
  bookBlood
} = require("./hospitalRequest.controller");

const FundRequest = require("../../models/FundRequest");
const Hospital = require("../../models/Hospital");

const { 
  createFundRequest, 
  updateFundRequest,
  getHospitalFundRequests,
  getAllFundRequests,
  updateFundRequestStatus,
  deleteFundRequest
} = require("./fundRequest.controller");

const { 
  createBloodRequest, 
  updateBloodRequest,
  getHospitalBloodRequests,
  getAllBloodRequests,
  updateBloodRequestStatus,
  dispatchBlood,
  getBloodStock,
  updateBloodStock,
  deleteBloodRequest
} = require("./bloodRequest.controller");

// Logging Middleware for debugging
router.use((req, res, next) => {
  console.log(`[HospitalRequest Router] ${req.method} ${req.url}`);
  next();
});

// Item Requests
router.get("/", getHospitalRequests); // Root compatibility
router.get("/item", getHospitalRequests); // For Item Manager
router.get("/history/hospital/:hospitalId", getHospitalDonationHistory);
router.get("/item/hospital/:hospitalId", getRequestsByHospital);
router.post("/item", createItemRequest);
router.put("/item/:id", updateItemRequest);
router.post("/item/:id/fulfill", fulfillItemRequest);
router.put("/item/:id/status", updateRequestStatus);
router.delete("/item/:id", deleteItemRequest);

// Donation Needs (Broadcasts)
router.get("/needs", getPublicDonationNeeds);
router.post("/needs/:id/donate", donateToNeed);
router.get("/needs/:id/donations", getDonationsForNeed);
router.get("/needs/donations/all", getAllDonations);
router.put("/needs/donations/:donationId/status", updateDonationStatus);
router.post("/needs/:id/transfer", transferNeedStock);
router.put("/needs/:id", updateDonationNeed);
router.delete("/needs/:id", deleteDonationNeed);
router.post("/needs", createDonationNeed);
router.post("/needs/:id/register", registerForCampaign);
router.get("/needs/:id/registrations", getRegistrationsForCampaign);
router.put("/needs/registrations/:id/status", updateBloodRegistrationStatus);
router.patch("/history/:historyId/status", updateHistoryStatus);

// Fund Requests
router.get("/fund/all", getAllFundRequests);
router.get("/fund/hospital/:hospitalId", getHospitalFundRequests);
router.post("/fund", createFundRequest);
router.put("/fund/:id", updateFundRequest);
router.put("/fund/:id/status", updateFundRequestStatus);
router.delete("/fund/:id", deleteFundRequest);

// Blood Requests
router.get("/blood/all", getAllBloodRequests);
router.get("/blood/stock", getBloodStock);
router.post("/blood/stock", updateBloodStock);
router.get("/blood/hospital/:hospitalId", getHospitalBloodRequests);
router.post("/blood", createBloodRequest);
router.put("/blood/:id", updateBloodRequest);
router.post("/blood/book", bookBlood);
router.post("/blood/:id/dispatch", dispatchBlood);
router.put("/blood/:id/status", updateBloodRequestStatus);
router.delete("/blood/:id", deleteBloodRequest);


module.exports = router;
