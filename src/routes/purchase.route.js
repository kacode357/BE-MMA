const express = require("express");
const PurchaseController = require("../controllers/purchase.controller");
const router = express.Router();

router.post("/purchases", PurchaseController.createPurchaseController);

module.exports = router;