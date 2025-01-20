const FoodModel = require("../models/food.model");
const CategoryModel = require("../models/category.model");

module.exports = {
  createFoodService: (foodData) =>
    new Promise(async (resolve, reject) => {
      try {
        // Kiểm tra xem danh mục có tồn tại không
        const categoryExists = await CategoryModel.findById(foodData.category);
        if (!categoryExists) {
          return reject({
            status: 404,
            ok: false,
            message: "Danh mục không tồn tại",
          });
        }

        // Tạo món ăn mới
        const newFood = await FoodModel.create(foodData);
        resolve({
          status: 201,
          ok: true,
          message: "Tạo món ăn thành công",
          food: newFood,
        });
      } catch (error) {
        // Xử lý lỗi trùng lặp
        if (error.code === 11000) {
          reject({
            status: 400,
            ok: false,
            message: "Tên món ăn đã tồn tại",
          });
        } else {
          // Xử lý lỗi không xác định
          reject({
            status: 500,
            ok: false,
            message: "Tạo món ăn thất bại. Lỗi: " + error.message,
          });
        }
      }
    }),
};
