const express = require("express");
const PurchaseController = require("../controllers/purchase.controller");
const router = express.Router();

// Tạo giao dịch mua
router.post("/purchases", PurchaseController.createPurchaseController);

// Tìm kiếm giao dịch mua
router.post("/purchases/search", PurchaseController.searchPurchasesController);

module.exports = router;