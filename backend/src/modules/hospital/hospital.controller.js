const Hospital = require("../../models/Hospital");

const getHospitalByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const hospital = await Hospital.findOne({ userId });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found for this user" });
    }

    res.json(hospital);
  } catch (error) {
    console.error("Error fetching hospital by user ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ name: 1 });
    res.json(hospitals);
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createHospital = async (req, res) => {
  try {
    const { userId, name, location, contactNumber } = req.body;
    const hospital = await Hospital.create({
        userId,
        name,
        location,
        contactNumber
    });
    res.status(201).json(hospital);
  } catch (error) {
    console.error("Error creating hospital:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getHospitalByUserId,
  getAllHospitals,
  createHospital
};
