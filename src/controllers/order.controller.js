const OrderService = require("../services/order.service");

module.exports = {
  createOrderController: async (req, res) => {
    try {
      const { items, created_by } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          ok: false,
          message: "Danh sách sản phẩm (items) không hợp lệ",
        });
      }

      const result = await OrderService.createOrderService({
        items,
        created_by,
      });

      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server",
      });
    }
  },
  getOrdersController: async (req, res) => {
    try {
      const { status } = req.query; // Lọc theo trạng thái nếu có

      const result = await OrderService.getOrdersService({ status });

      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi lấy danh sách đơn hàng",
      });
    }
  },

  // Lấy chi tiết một đơn hàng theo ID
  getOrderByIdController: async (req, res) => {
    try {
      const { orderId } = req.params;

      const result = await OrderService.getOrderByIdService({ orderId });

      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi lấy thông tin đơn hàng",
      });
    }
  },
  updateFoodQuantityController: async (req, res) => {
    try {
      const { food_id, quantity } = req.body;

      if (!food_id || typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({
          ok: false,
          message: "Yêu cầu phải có food_id và quantity hợp lệ (số lượng >= 0)",
        });
      }

      const result = await OrderService.updateFoodQuantityService({ food_id, quantity });

      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi cập nhật số lượng món ăn",
      });
    }
  },
  increaseFoodQuantityController: async (req, res) => {
    try {
      const { food_id } = req.body;

      if (!food_id) {
        return res.status(400).json({
          ok: false,
          message: "Yêu cầu phải có food_id",
        });
      }

      const result = await OrderService.increaseFoodQuantityService({ food_id });

      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi tăng số lượng món ăn",
      });
    }
  },

  // Giảm số lượng sản phẩm
  decreaseFoodQuantityController: async (req, res) => {
    try {
      const { food_id } = req.body;

      if (!food_id) {
        return res.status(400).json({
          ok: false,
          message: "Yêu cầu phải có food_id",
        });
      }

      const result = await OrderService.decreaseFoodQuantityService({ food_id });

      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi giảm số lượng món ăn",
      });
    }
  },
  
};
