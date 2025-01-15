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
      paymentMethod: "credit_card",
    });

    const paymentUrl = await createPaymentUrl(
      {
        amount: amountPaid ,
        language: "vn",
        paymentId: payment._id,
      },
      headers
    );

    return { payment, paymentUrl };
  },

  async createCashPayment(cartId, amountPaid) {
    const cart = await Cart.findById(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const payment = await Payment.create({
      cartId,
      amountPaid,
      status: "successful",
      paymentMethod: "cash",
    });

    return payment;
  },
};

module.exports = PaymentService;
