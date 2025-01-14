const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/payment.controller");

// Route tạo URL thanh toán
router.post("/create-payment", PaymentController.createPayment);
router.get("/payment/vnpsay-return", PaymentController.paymentCallback);
router.post("/payment/vnpay-ipn", PaymentController.paymentIpn); 



module.exports = router;
