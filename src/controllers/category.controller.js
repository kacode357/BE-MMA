const CategoryService = require("../services/category.service");

module.exports = {
  createCategoryController: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ ok: false, message: "Tên danh mục là bắt buộc" });
      }

      // Gọi service để tạo danh mục
      const result = await CategoryService.createCategoryService({ name, description });
      return res.status(result.status).json(result);
    } catch (error) {
      console.error(error.message);
      // Trả về lỗi từ service hoặc lỗi không xác định
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi không xác định",
      });
    }
  },

  getAllCategoriesController: async (req, res) => {
    try {
      const result = await CategoryService.getAllCategoriesService();
      return res.status(result.status).json(result);
    } catch (error) {
      console.error(error.message);
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi không xác định",
      });
    }
  },

  getCategoryByIdController: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await CategoryService.getCategoryByIdService(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error(error.message);
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi không xác định",
      });
    }
  },

  updateCategoryController: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const result = await CategoryService.updateCategoryService(id, { name, description });
      return res.status(result.status).json(result);
    } catch (error) {
      console.error(error.message);
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi không xác định",
      });
    }
  },

  deleteCategoryController: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await CategoryService.deleteCategoryService(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error(error.message);
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi không xác định",
      });
    }
  },
};
