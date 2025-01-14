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


};

module.exports = PaymentService;
