const FoodModel = require("../models/food.model");
const CategoryModel = require("../models/category.model");

module.exports = {
  // Tạo món ăn
  createFoodService: (foodData) =>
    new Promise(async (resolve, reject) => {
      try {
        const categoryExists = await CategoryModel.findById(foodData.category);
        if (!categoryExists) {
          return reject({
            status: 404,
            ok: false,
            message: "Danh mục không tồn tại",
          });
        }

        const newFood = await FoodModel.create(foodData);
        resolve({
          status: 201,
          ok: true,
          message: "Tạo món ăn thành công",
          food: newFood,
        });
      } catch (error) {
        if (error.code === 11000) {
          reject({
            status: 400,
            ok: false,
            message: "Tên món ăn đã tồn tại",
          });
        } else {
          reject({
            status: 500,
            ok: false,
            message: "Tạo món ăn thất bại. Lỗi: " + error.message,
          });
        }
      }
    }),
  // Lấy danh sách món ăn (tìm kiếm và phân trang)
  getFoodsService: ({ searchCondition, pageInfo }) =>
    new Promise(async (resolve, reject) => {
      try {
        const keyword = searchCondition?.keyword || "";
        const is_delete = searchCondition?.is_delete;
        const categoryName = searchCondition?.categoryName || ""; // Thêm categoryName vào điều kiện tìm kiếm
        const pageNum = pageInfo?.pageNum || 1;
        const pageSize = pageInfo?.pageSize || 10;
  
        let query = {};
  
        // Tìm kiếm theo tên món ăn
        if (keyword) {
          query.name = { $regex: keyword, $options: "i" };
        }
  
        // Lọc theo trạng thái xóa
        if (is_delete !== undefined) {
          query.is_deleted = is_delete;
        }
  
        // Nếu có categoryName, tìm kiếm theo tên danh mục
        if (categoryName) {
          // Tìm category có tên phù hợp
          const category = await CategoryModel.findOne({ name: { $regex: categoryName, $options: "i" } });
  
          if (category) {
            query.category = category._id; // Lọc theo _id của category nếu tìm thấy
          } else {
            return resolve({
              status: 200,
              ok: true,
              message: "Không tìm thấy danh mục nào phù hợp",
              data: {
                pageData: [],
                pageInfo: {
                  pageNum,
                  pageSize,
                  totalItems: 0,
                  totalPages: 0,
                },
              },
            });
          }
        }
  
        const totalItems = await FoodModel.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);
  
        const foods = await FoodModel.find(query)
          .populate("category", "name") // Lấy thông tin category
          .skip((pageNum - 1) * pageSize)
          .limit(pageSize);
  
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
          category_id: food.category?._id || null,
        }));
  
        resolve({
          status: 200,
          ok: true,
          message: "Lấy danh sách món ăn thành công",
          data: {
            pageData: formattedFoods,
            pageInfo: {
              pageNum,
              pageSize,
              totalItems,
              totalPages,
            },
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
  
 // Lấy món ăn theo ID
getFoodByIdService: (id) =>
  new Promise(async (resolve, reject) => {
    try {
      // Lấy thông tin món ăn và populate danh mục
      const food = await FoodModel.findById(id).populate("category", "name");

      if (!food) {
        return reject({
          status: 404,
          ok: false,
          message: "Món ăn không tồn tại",
        });
      }

      // Format dữ liệu trả về
      const formattedFood = {
        _id: food._id,
        name: food.name,
        price: food.price,
        description: food.description,
        image_url: food.image_url,
        is_deleted: food.is_deleted,
        createdAt: food.createdAt,
        updatedAt: food.updatedAt,
        category_name: food.category?.name || null,
        category_id: food.category?._id || null,
      };

      resolve({
        status: 200,
        ok: true,
        message: "Lấy món ăn thành công",
        data: formattedFood,
      });
    } catch (error) {
      reject({
        status: 500,
        ok: false,
        message: "Lỗi khi lấy món ăn. " + error.message,
      });
    }
  }),
  // Cập nhật món ăn
  updateFoodService: (id, foodData) =>
    new Promise(async (resolve, reject) => {
      try {
        // Kiểm tra danh mục có tồn tại không
        if (foodData.category) {
          const categoryExists = await CategoryModel.findById(
            foodData.category
          );
          if (!categoryExists) {
            return reject({
              status: 404,
              ok: false,
              message: "Danh mục không tồn tại",
            });
          }
        }

        // Cập nhật món ăn
        const updatedFood = await FoodModel.findByIdAndUpdate(id, foodData, {
          new: true,
          runValidators: true,
        });

        if (!updatedFood) {
          return reject({
            status: 404,
            ok: false,
            message: "Món ăn không tồn tại",
          });
        }

        resolve({
          status: 200,
          ok: true,
          message: "Cập nhật món ăn thành công",
          data: updatedFood,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi cập nhật món ăn. " + error.message,
        });
      }
    }),

  // Xóa mềm món ăn
  deleteFoodService: (id) =>
    new Promise(async (resolve, reject) => {
      try {
        const deletedFood = await FoodModel.findByIdAndUpdate(
          id,
          { is_deleted: true },
          { new: true }
        );

        if (!deletedFood) {
          return reject({
            status: 404,
            ok: false,
            message: "Món ăn không tồn tại",
          });
        }

        resolve({
          status: 200,
          ok: true,
          message: "Xóa món ăn thành công (xóa mềm)",
          data: deletedFood,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi xóa món ăn. " + error.message,
        });
      }
    }),
};
