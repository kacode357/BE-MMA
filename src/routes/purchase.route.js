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

// Nâng cấp role lên Premium
router.post("/purchases/upgrade-premium", auth, PurchaseController.upgradePremiumController);

// Hoàn tất giao dịch và nâng cấp role nếu là gói Premium
router.post("/purchases/complete", auth, PurchaseController.completePurchaseController);

module.exports = router;