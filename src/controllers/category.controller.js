const CategoryService = require("../services/category.service");

module.exports = {
  // Controller tạo danh mục
  createCategoryController: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ ok: false, message: "Tên danh mục là bắt buộc" });
      }

      // Gọi Service để xử lý logic
      const result = await CategoryService.createCategoryService({ name, description });

      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in createCategoryController:", error.message);
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi tạo danh mục",
      });
    }
  },

  // Controller lấy danh sách danh mục
  getAllCategoriesController: async (req, res) => {
    try {
      const { searchCondition, pageInfo } = req.body;

      // Gọi Service để xử lý logic
      const result = await CategoryService.getAllCategoriesService({ searchCondition, pageInfo });

      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in getAllCategoriesController:", error.message);
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi lấy danh sách danh mục",
      });
    }
  },
    // Lấy danh mục theo ID
    getCategoryByIdController: async (req, res) => {
      try {
        const { id } = req.params;
  
        const result = await CategoryService.getCategoryByIdService(id);
  
        return res.status(result.status).json(result);
      } catch (error) {
        console.error("Error in getCategoryByIdController:", error.message);
        return res.status(error.status || 500).json({
          ok: false,
          message: error.message || "Lỗi server khi lấy danh mục theo ID",
        });
      }
    },
  
    // Cập nhật danh mục
    updateCategoryController: async (req, res) => {
      try {
        const { id } = req.params;
        const { name, description } = req.body;
  
        const result = await CategoryService.updateCategoryService(id, { name, description });
  
        return res.status(result.status).json(result);
      } catch (error) {
        console.error("Error in updateCategoryController:", error.message);
        return res.status(error.status || 500).json({
          ok: false,
          message: error.message || "Lỗi server khi cập nhật danh mục",
        });
      }
    },
  
    // Xóa mềm danh mục
    deleteCategoryController: async (req, res) => {
      try {
        const { id } = req.params;
  
        const result = await CategoryService.deleteCategoryService(id);
  
        return res.status(result.status).json(result);
      } catch (error) {
        console.error("Error in deleteCategoryController:", error.message);
        return res.status(error.status || 500).json({
          ok: false,
          message: error.message || "Lỗi server khi xóa danh mục",
        });
      }
    },
};
