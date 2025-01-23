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



    getFoodsService: ({ searchCondition, pageInfo }) =>
      new Promise(async (resolve, reject) => {
        try {
          const keyword = searchCondition?.keyword || ""; // Từ khóa tìm kiếm
          const is_delete = searchCondition?.is_delete; // Trạng thái xóa
          const pageNum = pageInfo?.pageNum || 1; // Số trang hiện tại
          const pageSize = pageInfo?.pageSize || 10; // Số item mỗi trang
  
          // Nếu `keyword` là chuỗi rỗng, không áp dụng điều kiện tìm kiếm theo tên
          const query = keyword
            ? { name: { $regex: keyword, $options: "i" } }
            : {};
  
          if (is_delete !== undefined) query.is_deleted = is_delete; // Thêm điều kiện lọc theo trạng thái xóa nếu có
  
          const totalItems = await FoodModel.countDocuments(query); // Tổng số item phù hợp
          const totalPages = Math.ceil(totalItems / pageSize); // Tổng số trang
  
          // Lấy dữ liệu với phân trang
          const foods = await FoodModel.find(query)
            .populate("category", "name") // Lấy thông tin danh mục
            .skip((pageNum - 1) * pageSize) // Bỏ qua các item trước đó
            .limit(pageSize); // Lấy số item tương ứng với `pageSize`
          
          // Định dạng dữ liệu món ăn
          const formattedFoods = foods.map((food) => ({
            _id: food._id,
            name: food.name,
            price: food.price,
            description: food.description,
            image_url: food.image_url,
            is_deleted: food.is_deleted,
            createdAt: food.createdAt,
            updatedAt: food.updatedAt,
            category_name: food.category?.name || null,
          }));
  
          resolve({
            status: 200,
            ok: true,
            message: "Lấy danh sách món ăn thành công",
            pageData: formattedFoods,
            pageInfo: {
              pageNum,
              pageSize,
              totalItems,
              totalPages,
            },
          });
        } catch (error) {
          reject({
            status: 500,
            ok: false,
            message: error.message || "Lỗi khi lấy danh sách món ăn",
          });
        }
      }),

};
