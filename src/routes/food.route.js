const express = require("express");
const FoodController = require("../controllers/food.controller");
const router = express.Router();

// Route tạo món ăn
router.post("/foods", FoodController.createFoodController);

// Route lấy danh sách món ăn (tìm kiếm và phân trang)
router.post("/foods/search", FoodController.getFoodsController);

// Route lấy món ăn theo ID
router.get("/foods/:id", FoodController.getFoodByIdController);

// Route cập nhật món ăn
router.put("/foods/:id", FoodController.updateFoodController);

// Route xóa mềm món ăn
router.delete("/foods/:id", FoodController.deleteFoodController);

module.exports = router;
