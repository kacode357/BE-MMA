const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/payment.controller");

// Route tạo URL thanh toán
router.post("/create-payment", PaymentController.createPayment);




module.exports = router;
