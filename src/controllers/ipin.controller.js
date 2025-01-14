const Payment = require("../models/payment.model");
const { validateIpnSignature } = require("../utils/validateIpnSignature");

const IPNController = {
  async handleIPN(req, res) {
    try {
       
      const queryData = req.query;
    
      const isValidSignature = validateIpnSignature(queryData);

      if (!isValidSignature) {
        return res.status(400).json({ message: "Invalid signature" });
      }

      const { vnp_TxnRef: paymentId, vnp_ResponseCode, vnp_Amount } = queryData;

      // Tìm payment trong database
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Cập nhật trạng thái thanh toán
      if (vnp_ResponseCode === "00") {
        payment.status = "success";
      } else {
        payment.status = "failed";
      }

      payment.amountPaid = parseInt(vnp_Amount) / 1000; // VNPay trả về amount nhân với 100
      await payment.save();

      res.status(200).json({ message: "IPN handled successfully" });
    } catch (error) {
      console.error("Error handling IPN:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = IPNController;
