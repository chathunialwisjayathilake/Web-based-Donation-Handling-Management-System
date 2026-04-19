const express = require("express");
const router = express.Router();
const bloodController = require("./bloodDonation.controller");

router.get("/stock", bloodController.getBloodStock);
router.post("/stock", bloodController.updateBloodStock);
router.get("/seed", bloodController.seedBloodStock);
router.get("/all", bloodController.getAllDonations);
router.get("/donor/:donorId", bloodController.getDonorDonations);
router.get("/activity/:bloodType", bloodController.getBloodActivity);

// General ID routes must be last
router.patch("/:id", bloodController.updateDonation);
router.delete("/:id", bloodController.deleteDonation);

module.exports = router;
