const express = require("express");
const CategoryController = require("../controllers/category.controller");
const router = express.Router();

// Route tạo mới một category
router.post("/categories", CategoryController.createCategoryController);

// Route lấy danh sách categories
router.post("/categories/search", CategoryController.getAllCategoriesController);

// Route lấy danh mục theo ID
router.get("/categories/:id", CategoryController.getCategoryByIdController);

// Route cập nhật danh mục
router.put("/categories/:id", CategoryController.updateCategoryController);

// Route xóa mềm danh mục
router.delete("/categories/:id", CategoryController.deleteCategoryController);


module.exports = router;
