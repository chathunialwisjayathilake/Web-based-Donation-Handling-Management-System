const express = require("express");
const router = express.Router();
const controller = require("./category.controller");

router.post("/", controller.createCategory);
router.get("/", controller.getAllCategories);
router.delete("/:id", controller.deleteCategory);
router.put("/:id", controller.updateCategory);

module.exports = router;
