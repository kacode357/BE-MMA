const PaymentService = require("../services/payment.service");

module.exports = {
  createPaymentController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, purchase_id, amount, payment_method } = req.body;

        const result = await PaymentService.createPaymentService({
          user_id,
          purchase_id,
          amount,
          payment_method,
        });

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi tạo thanh toán",
        });
      }
    }),
};