const express = require("express");
const PaymentController = require("../controllers/payment.controller");
const router = express.Router();

router.post("/payments", PaymentController.createPaymentController);

module.exports = router;