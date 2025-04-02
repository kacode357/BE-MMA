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

const getPaymentDashboard = async () => {
  try {
    // Tổng số thanh toán đã được trả thành công (status = "paid")
    const totalPaidPayments = await Payment.countDocuments({ status: "paid" });

    // Tổng số tiền đã thanh toán thành công
    const totalPaidAmount = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Thống kê phương thức thanh toán thành công (cash, qr_code)
    const paymentMethodStats = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$method", count: { $sum: 1 } } }
    ]);

    // Tổng số đơn hàng đã thanh toán thành công
    const totalPaidOrders = await Order.countDocuments({ is_paid: true });

    // Tổng doanh thu từ các đơn hàng đã thanh toán thành công
    const totalRevenue = await Order.aggregate([
      { $match: { is_paid: true } },
      { $group: { _id: null, total: { $sum: "$total_price" } } }
    ]);

    // Danh sách đơn hàng gần đây đã thanh toán thành công
    const recentPaidOrders = await Order.find({ is_paid: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("created_by", "name") // Lấy thông tin nhân viên tạo đơn
      .populate("items.food_id", "name price"); // Lấy thông tin món ăn trong đơn

    return {
      totalPaidPayments,
      totalPaidAmount: totalPaidAmount.length > 0 ? totalPaidAmount[0].total : 0,
      paymentMethodStats,
      totalPaidOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      recentPaidOrders,
    };
  } catch (error) {
    throw new Error("Error retrieving dashboard data: " + error.message);
  }
};
module.exports = {
  getPaymentDashboard,
  createPayment,
  getPaymentById,
  updatePaymentStatus,
};
