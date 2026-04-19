const express = require("express");
const router = express.Router();
const { 
  getAlerts, 
  markAsRead, 
  markAllAsRead 
} = require("./alert.controller");

router.get("/", getAlerts);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

module.exports = router;
