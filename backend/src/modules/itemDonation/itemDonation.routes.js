const express = require("express");
const router = express.Router();
const { 
  getAllItemDonations, 
  createItemDonation,
  updateItemDonation,
  deleteItemDonation,
  getDashboardStats,
  getAvailableItemNames
} = require("./itemDonation.controller");

router.get("/stats", getDashboardStats);
router.get("/available-items", getAvailableItemNames);
router.get("/", getAllItemDonations);
router.post("/", createItemDonation);
router.put("/:id", updateItemDonation);
router.delete("/:id", deleteItemDonation);

module.exports = router;
