const BloodCollectionLocation = require('../../models/BloodCollectionLocation');

const getLocations = async (req, res) => {
    try {
        const locations = await BloodCollectionLocation.find().sort({ city: 1, name: 1 });
        res.status(200).json(locations);
    } catch (error) {
        console.error("Error fetching locations:", error);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
};

const createLocation = async (req, res) => {
    try {
        const { name, address, city, contactNumber, isAvailable } = req.body;
        const location = new BloodCollectionLocation({
            name,
            address,
            city,
            contactNumber,
            isAvailable: isAvailable ?? true
        });
        await location.save();
        res.status(201).json(location);
    } catch (error) {
        console.error("Error creating location:", error);
        res.status(500).json({ message: "Failed to create location" });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await BloodCollectionLocation.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Location not found" });
        res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ message: "Failed to update location" });
    }
};

const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await BloodCollectionLocation.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Location not found" });
        res.status(200).json({ message: "Location deleted successfully" });
    } catch (error) {
        console.error("Error deleting location:", error);
        res.status(500).json({ message: "Failed to delete location" });
    }
};

module.exports = {
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation
};
