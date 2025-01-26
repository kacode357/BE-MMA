const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/payment.controller");

// Tạo thanh toán mới
router.post("/payment", PaymentController.createPayment);

// Lấy thông tin thanh toán theo ID
router.get("/payment/:id", PaymentController.getPayment);

// Cập nhật trạng thái thanh toán
router.put("/payment/:id", PaymentController.updatePaymentStatus);



module.exports = router;
