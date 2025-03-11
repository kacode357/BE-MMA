const Payment = require("../models/payment.model");
const { createPaymentUrl } = require("../utils/vnpayHelper");

const PaymentService = {
  async createPayment(testId, amountPaid, headers) {
    // Tạo bản ghi thanh toán mới
    const payment = await Payment.create({
      testId,
      amountPaid,
      status: "pending",
      paymentMethod: "credit_card",
    });

    // Tạo URL thanh toán
    const paymentUrl = await createPaymentUrl(
      {
        amount: amountPaid,
        language: "vn",
        paymentId: payment._id,
      },
      headers
    );

    return { payment, paymentUrl };
  },
  async createCashPayment(testId, amountPaid) {
    // Tạo bản ghi thanh toán cho thanh toán tiền mặt
    const payment = await Payment.create({
      testId,
      amountPaid,
      status: "successful",
      paymentMethod: "cash",
    });

    return payment;
  },
};

module.exports = PaymentService;
