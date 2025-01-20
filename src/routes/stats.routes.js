const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");

// Định nghĩa các tuyến API
router.get("/revenue", statsController.getRevenue); 
router.get("/items-sold", statsController.getItemsSold);
router.get("/orders", statsController.getOrdersCount); 

module.exports = router;
