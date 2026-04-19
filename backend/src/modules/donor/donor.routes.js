const express = require("express");
const router = express.Router();

const { searchDonors, getAllDonors, getDonorFullDetails, updateDonor, deleteDonor, getGlobalStats } = require("./donor.controller");

router.get("/search", searchDonors);
router.get("/stats", getGlobalStats);
router.get("/", getAllDonors);
router.get("/:id/details", getDonorFullDetails);
router.put("/:id", updateDonor);
router.delete("/:id", deleteDonor);

module.exports = router;
router.delete("/:id", deleteDonor);

module.exports = router;
