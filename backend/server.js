const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./src/config/db");
const mongoose = require("mongoose");

// Load environment variables
dotenv.config();

const app = express();

// ERROR HANDLING: Catch-all for process-level failures
process.on("uncaughtException", (err) => {
  console.error("🔥 CRITICAL: Uncaught Exception:", err);
  // Log more details if possible, but don't exit if it's not fatal for the whole system
  // (though usually, it's safer to exit after logging)
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🌊 CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});

// Connect to MongoDB via Mongoose
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./src/modules/auth/auth.routes"));
app.use("/api/donors", require("./src/modules/donor/donor.routes"));
app.use("/api/bookings", require("./src/modules/bloodDonation/bloodDonation.routes"));
app.use("/api/fund-donations", require("./src/modules/fundDonation/fundDonation.routes"));
app.use("/api/item-donations", require("./src/modules/itemDonation/itemDonation.routes"));
app.use("/api/hospital-requests", require("./src/modules/hospitalRequest/hospitalRequest.routes"));
app.use("/api/hospitals", require("./src/modules/hospital/hospital.routes"));
app.use("/api/categories", require("./src/modules/category/category.routes"));
app.use("/api/alerts", require("./src/modules/alert/alert.routes"));
app.use("/api/alerts", require("./src/modules/alert/alert.routes"));
app.use("/api/notifications", require("./src/modules/notification/notification.routes"));
app.use("/api/centers", require("./src/modules/bloodLocation/bloodLocation.routes"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Donation System API is running 🚀" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected");
  process.exit(0);
});
