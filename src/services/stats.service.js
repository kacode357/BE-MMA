const Payment = require("../models/payment.model");
const Cart = require("../models/cart.model");
const Food = require("../models/food.model");

// Tính tổng doanh thu từ các thanh toán
exports.calculateRevenue = async () => {
  const revenue = await Payment.aggregate([
    { $match: { status: "successful" } }, // Lọc thanh toán thành công
    { $group: { _id: null, totalRevenue: { $sum: "$amountPaid" } } },
  ]);
  return revenue[0]?.totalRevenue || 0;
};

// Tính số lượng sản phẩm bán ra theo danh mục
exports.calculateItemsSold = async () => {
  const itemsSold = await Cart.aggregate([
    { $unwind: "$items" }, // Tách các sản phẩm trong giỏ
    {
      $lookup: {
        from: "foods", // Nối với bảng Food
        localField: "items.foodId",
        foreignField: "_id",
        as: "food",
      },
    },
    { $unwind: "$food" }, // Giải nén mảng food
    {
      $group: {
        _id: "$food.category", // Nhóm theo danh mục
        totalSold: { $sum: "$items.quantity" },
      },
    },
  ]);
  return itemsSold; // Trả về danh sách các danh mục và tổng số lượng
};

// Tính tổng số đơn hàng đã hoàn thành
exports.calculateOrdersCount = async () => {
  const ordersCount = await Cart.countDocuments({ status: "completed" }); // Đếm đơn hàng hoàn thành
  return ordersCount;
};
