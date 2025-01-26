const Payment = require("../models/payment.model");
const Order = require("../models/order.model");

const createPayment = async (data) => {
  try {
    // Kiểm tra đơn hàng có tồn tại không
    const order = await Order.findById(data.order_id);
    if (!order) {
      throw new Error("Order does not exist.");
    }

    // Tạo thanh toán mới
    const payment = new Payment(data);
    await payment.save();
    return payment;
  } catch (error) {
    throw new Error("Error creating payment: " + error.message);
  }
};

const getPaymentById = async (id) => {
  try {
    const payment = await Payment.findById(id).populate("order_id");
    return payment;
  } catch (error) {
    throw new Error("Error retrieving payment: " + error.message);
  }
};

const updatePaymentStatus = async (id, status, method) => {
  try {
    // Cập nhật trạng thái và phương thức thanh toán của Payment
    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      { 
        status, 
        method, 
        paid_at: status === "paid" ? new Date() : null 
      },
      { new: true }
    );

    if (!updatedPayment) {
      throw new Error("Payment not found.");
    }

    // Nếu trạng thái Payment là "paid", cập nhật Order tương ứng
    if (status === "paid") {
      const order = await Order.findById(updatedPayment.order_id);
      if (order) {
        order.status = "completed";
        order.is_paid = true;
        order.payment_method = method; // Cập nhật method vào Order
        await order.save();
      } else {
        throw new Error("Associated order not found.");
      }
    }

    return updatedPayment;
  } catch (error) {
    throw new Error("Error updating payment status: " + error.message);
  }
};


module.exports = {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
};
