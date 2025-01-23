const statsService = require("../services/stats.service");

// Controller: Thống kê doanh thu
exports.getRevenue = async (req, res) => {
  try {
    const revenue = await statsService.calculateRevenue();
    res.status(200).json({ totalRevenue: revenue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller: Thống kê số lượng sản phẩm bán ra
exports.getItemsSold = async (req, res) => {
  try {
    const itemsSold = await statsService.calculateItemsSold();
    res.status(200).json(itemsSold);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller: Thống kê tổng số đơn hàng
exports.getOrdersCount = async (req, res) => {
  try {
    const ordersCount = await statsService.calculateOrdersCount();
    res.status(200).json({ totalOrders: ordersCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
