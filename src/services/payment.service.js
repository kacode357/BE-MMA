const Cart = require("../models/cart.model");
const Payment = require("../models/payment.model");
const { createPaymentUrl } = require("../utils/vnpayHelper");
const { validateIpnSignature } = require("../utils/vnpayHelper");

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
        paymentId: payment._id,
      },
      headers
    );

    return { payment, paymentUrl };
  },

  async handlePaymentCallback(queryParams) {
    const { vnp_TransactionStatus, vnp_OrderInfo } = queryParams;

    // Kiểm tra trạng thái thanh toán từ cổng VNPay
    if (vnp_TransactionStatus === "00") {
      // Cập nhật trạng thái Payment
      const payment = await Payment.findOneAndUpdate(
        { _id: vnp_OrderInfo },
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
  async handleIpn(ipnData) {
    const { vnp_SecureHash, ...params } = ipnData;

    // Validate the IPN signature
    if (!validateIpnSignature(params, vnp_SecureHash)) {
      throw new Error("Invalid signature");
    }

    const { vnp_TransactionStatus, vnp_OrderInfo } = params;

    if (vnp_TransactionStatus === "00") {
      const payment = await Payment.findOneAndUpdate(
        { _id: vnp_OrderInfo },
        { status: "success" },
        { new: true }
      );

      await Cart.findByIdAndUpdate(payment.cartId, { status: "success" });

      return { status: "success", payment };
    } else {
      await Payment.findOneAndUpdate(
        { _id: vnp_OrderInfo },
        { status: "failed" }
      );

      return { status: "failed" };
    }
  },
};

module.exports = PaymentService;
