const express = require("express");
const PaymentController = require("../controllers/payment.controller");
const router = express.Router();

// Endpoint để tạo thanh toán
router.post("/payments", PaymentController.createPaymentController);

// Endpoint để nhận Webhook từ SePay
router.post("/webhooks/sepay", PaymentController.handleSepayWebhook);

module.exports = router;