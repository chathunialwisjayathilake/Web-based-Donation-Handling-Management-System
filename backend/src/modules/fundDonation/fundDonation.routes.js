const express = require("express");
const router = express.Router();

const { createFundDonation, getFundDonations, updateFundDonation } = require("./fundDonation.controller");

router.post("/", createFundDonation);
router.get("/", getFundDonations);
router.put("/:id", updateFundDonation);

module.exports = router;
