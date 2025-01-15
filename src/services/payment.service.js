const Cart = require("../models/cart.model");
const Payment = require("../models/payment.model");
const { createPaymentUrl } = require("../utils/vnpayHelper");

const PaymentService = {
  async createPayment(cartId, amountPaid, headers) {
    // Fetch the cart to ensure it exists
    const cart = await Cart.findById(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }
  
    // Create a payment record
    const payment = await Payment.create({
      cartId,
      amountPaid,
      status: "pending",
      paymentMethod: "credit_card", // Assuming 'credit_card' as the payment method for this example
    });
  
    // Generate the payment URL
    const paymentUrl = await createPaymentUrl(
      {
        amount: amountPaid,
        language: "vn", // Vietnamese locale
        paymentId: payment._id,
      },
      headers
    );
  
    // Return the created payment and the generated URL
    return { payment, paymentUrl };
  }
  async createCashPayment(cartId, amountPaid) {
    const cart = await Cart.findById(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Create a new payment
    const payment = await Payment.create({
      cartId,
      amountPaid,
      status: "successful",
      paymentMethod: "cash",
    });

    // Update the cart status to 'completed'
    cart.status = "completed";
    await cart.save();

    return payment;
  },
};

module.exports = PaymentService;
