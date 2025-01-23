const express = require("express");
const router = express.Router();
const CheckApi = require("../controllers/checkapi.controller");

// Route xử lý IPN callback từ VNPay
router.get("/", CheckApi.checkApiRunning);

module.exports = router;
