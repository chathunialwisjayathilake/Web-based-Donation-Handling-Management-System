const express = require("express");
const router = express.Router();
const { getHospitalByUserId, getAllHospitals, createHospital } = require("./hospital.controller");

router.get("/", getAllHospitals);
router.get("/user/:userId", getHospitalByUserId);
router.post("/", createHospital);

module.exports = router;
