const express = require("express");
const router = express.Router();
const IPNController = require("../controllers/ipin.controller");

// Route xử lý IPN callback từ VNPay
router.post("/vnpay-ipn", IPNController.handleIPN);

module.exports = router;
