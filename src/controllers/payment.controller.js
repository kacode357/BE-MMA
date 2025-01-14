const PaymentService = require("../services/payment.service");

const PaymentController = {
  async createPayment(req, res) {
    try {
      const { cartId, amountPaid } = req.body;

      const { payment, paymentUrl } = await PaymentService.createPayment(cartId, amountPaid, req.headers);

      res.status(200).json({
        message: "Payment created successfully",
        payment,
        paymentUrl,
      });

    } catch (error) {
      console.error("Error creating payment:", error.message);
      res.status(400).json({ error: error.message });
    }
  },

  async paymentCallback(req, res) {
    try {
      const paymentStatus = await PaymentService.handlePaymentCallback(req.query);

      res.status(200).json({
        message: "Payment status updated successfully",
        paymentStatus,
      });
    } catch (error) {
      console.error("Error in payment callback:", error.message);
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = PaymentController;
