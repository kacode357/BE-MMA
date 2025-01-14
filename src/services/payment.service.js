const Cart = require("../models/cart.model");
const Payment = require("../models/payment.model");

const { createPaymentUrl } = require("../utils/vnpayHelper");
const PaymentService = {
  async createPayment(cartId, amountPaid, headers) {
    const cart = await Cart.findById(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const payment = await Payment.create({
      cartId,
      amountPaid,
      status: "pending",
    });

    const paymentUrl = await createPaymentUrl(
      {
        amount: amountPaid * 1000,
        language: "vn",
        returnUrl: "https://mmaposwebv1.vercel.app/v1/api/payment-callback"
      },
      headers
    );

    return { payment, paymentUrl };
  },

  async handlePaymentCallback(queryParams) {
    const { vnp_TransactionStatus, vnp_TxnRef } = queryParams;

    // Kiểm tra trạng thái thanh toán từ cổng VNPay
    if (vnp_TransactionStatus === "00") {
      // Cập nhật trạng thái Payment
      const payment = await Payment.findOneAndUpdate(
        { _id: vnp_TxnRef },
        { status: "success" },
        { new: true }
      );

      // Cập nhật trạng thái Cart
      await Cart.findByIdAndUpdate(payment.cartId, { status: "success" });

      return "success";
    } else {
      throw new Error("Payment failed or canceled");
    }
  },
};

module.exports = PaymentService;
