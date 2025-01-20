const FoodService = require("../services/food.service");

module.exports = {
  createFoodController: async (req, res) => {
    try {
      const { name, category, price, description, image_url } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!name || !category || !price) {
        return res.status(400).json({
          ok: false,
          message: "Tên, danh mục và giá là bắt buộc",
        });
      }

      // Gọi service để tạo món ăn
      const result = await FoodService.createFoodService({
        name,
        category,
        price,
        description,
        image_url,
      });

      return res.status(result.status).json(result);
    } catch (error) {
      console.error(error.message);

      // Đảm bảo trả về mã lỗi và thông báo từ service
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server",
      });
    }
  },
};
