const express = require("express");
const PurchaseController = require("../controllers/purchase.controller");
const auth = require("../middleware/auth");
const router = express.Router();

// Tạo giao dịch mua
router.post("/purchases", auth, PurchaseController.createPurchaseController);

// Tìm kiếm giao dịch mua
router.post("/purchases/search", auth, PurchaseController.searchPurchasesController);

// Kiểm tra trạng thái giao dịch mua
router.post("/purchases/check", auth, PurchaseController.checkPurchaseController);

module.exports = router;