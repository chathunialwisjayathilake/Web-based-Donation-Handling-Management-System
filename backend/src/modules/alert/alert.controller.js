const Alert = require("../../models/Alert");

// Internal helper to create an alert
const createAlert = async ({ type, title, message, category }) => {
  try {
    return await Alert.create({ type, title, message, category });
  } catch (error) {
    console.error("Error creating alert:", error);
  }
};

const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: "Error fetching alerts" });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await Alert.findByIdAndUpdate(id, { isRead: true });
    res.json({ message: "Alert marked as read" });
  } catch (error) {
    console.error("Error marking alert as read:", error);
    res.status(500).json({ message: "Error marking alert as read" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: "All alerts marked as read" });
  } catch (error) {
    console.error("Error marking all alerts as read:", error);
    res.status(500).json({ message: "Error marking all alerts as read" });
  }
};

module.exports = {
  getAlerts,
  markAsRead,
  markAllAsRead,
  createAlert // Exported for internal use by other controllers
};
