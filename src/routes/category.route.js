const express = require("express");
const CategoryController = require("../controllers/category.controller");
const router = express.Router();

// Route tạo mới một category
router.post("/categories", CategoryController.createCategoryController);

// Route lấy danh sách categories
router.get("/categories", CategoryController.getAllCategoriesController);

// Route lấy thông tin chi tiết một category theo ID
router.get("/categories/:id", CategoryController.getCategoryByIdController);

// Route cập nhật thông tin một category
router.put("/categories/:id", CategoryController.updateCategoryController);

// Route xóa một category
router.delete("/categories/:id", CategoryController.deleteCategoryController);

module.exports = router;
