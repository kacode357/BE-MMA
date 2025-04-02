const FoodService = require("../services/food.service");

module.exports = {
  // Tạo món ăn
  createFoodController: async (req, res) => {
    try {
      const { name, category, price, description, image_url } = req.body;
      if (!name || !category || !price) {
        return res.status(400).json({
          ok: false,
          message: "Tên, danh mục và giá là bắt buộc",
        });
      }
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
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server",
      });
    }
  },
  // Lấy danh sách món ăn (tìm kiếm và phân trang)
  getFoodsController: async (req, res) => {
    try {
      const { searchCondition, pageInfo } = req.body;

      const result = await FoodService.getFoodsService({ searchCondition, pageInfo });

      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi lấy danh sách món ăn",
      });
    }
  },
    // Lấy món ăn theo ID
    getFoodByIdController: async (req, res) => {
      try {
        const { id } = req.params;
  
        const result = await FoodService.getFoodByIdService(id);
  
        return res.status(result.status).json(result);
      } catch (error) {
        console.error("Error in getFoodByIdController:", error.message);
        return res.status(error.status || 500).json({
          ok: false,
          message: error.message || "Lỗi server khi lấy món ăn theo ID",
        });
      }
    },
  
    // Cập nhật món ăn
    updateFoodController: async (req, res) => {
      try {
        const { id } = req.params;
        const { name, category, price, description, image_url } = req.body;
  
        const result = await FoodService.updateFoodService(id, {
          name,
          category,
          price,
          description,
          image_url,
        });
  
        return res.status(result.status).json(result);
      } catch (error) {
        console.error("Error in updateFoodController:", error.message);
        return res.status(error.status || 500).json({
          ok: false,
          message: error.message || "Lỗi server khi cập nhật món ăn",
        });
      }
    },
  
    // Xóa mềm món ăn
    deleteFoodController: async (req, res) => {
      try {
        const { id } = req.params;
  
        const result = await FoodService.deleteFoodService(id);
  
        return res.status(result.status).json(result);
      } catch (error) {
        console.error("Error in deleteFoodController:", error.message);
        return res.status(error.status || 500).json({
          ok: false,
          message: error.message || "Lỗi server khi xóa món ăn",
        });
      }
    },
};
