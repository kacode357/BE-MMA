const express = require("express");
const FoodController = require("../controllers/food.controller");
const router = express.Router();

// API tạo món ăn
router.post("/foods", FoodController.createFoodController);

module.exports = router;
