const FoodModel = require("../models/food.model"); // Đường dẫn tới model Food

module.exports = {
  createFoodService: (foodData) =>
    new Promise(async (resolve, reject) => {
      try {
        // Tạo món ăn mới
        const newFood = await FoodModel.create(foodData);
        resolve({
          status: 201,
          ok: true,
          message: "Tạo món ăn thành công",
          food: newFood,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Tạo món ăn thất bại",
        });
      }
    }),

  getFoodsService: async ({ keyword, is_delete, offset, limit }) => {
    try {
      // Tạo query tìm kiếm
      const query = {
        name: { $regex: keyword, $options: "i" }, // Tìm kiếm theo từ khóa (không phân biệt chữ hoa/thường)
        is_deleted: is_delete, // Lọc theo is_deleted
      };

      // Đếm tổng số bản ghi
      const total = await FoodModel.countDocuments(query);

      // Lấy dữ liệu phân trang
      const foods = await FoodModel.find(query)
        .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo giảm dần
        .skip(offset)
        .limit(limit);

      return { foods, total };
    } catch (error) {
      console.error("Error in getFoodsService:", error.message);
      throw new Error("Lỗi khi lấy dữ liệu foods");
    }
  },
};
