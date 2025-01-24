const CategoryModel = require("../models/category.model");

module.exports = {
  // Service tạo danh mục
  createCategoryService: ({ name, description }) =>
    new Promise(async (resolve, reject) => {
      try {
        const newCategory = await CategoryModel.create({ name, description });
        resolve({
          status: 201,
          ok: true,
          message: "Tạo danh mục thành công",
          data: newCategory,
        });
      } catch (error) {
        if (error.code === 11000) {
          reject({
            status: 400,
            ok: false,
            message: "Tên danh mục đã tồn tại. Vui lòng sử dụng tên khác.",
          });
        } else {
          reject({
            status: 500,
            ok: false,
            message: "Tạo danh mục thất bại. Lỗi: " + error.message,
          });
        }
      }
    }),

  // Service lấy danh sách danh mục
  getAllCategoriesService: ({ searchCondition, pageInfo }) =>
    new Promise(async (resolve, reject) => {
      try {
        const keyword = searchCondition?.keyword || ""; // Từ khóa tìm kiếm
        const is_delete = searchCondition?.is_delete; // Trạng thái xóa
        const pageNum = pageInfo?.pageNum || 1; // Số trang hiện tại
        const pageSize = pageInfo?.pageSize || 10; // Số mục mỗi trang

        // Xây dựng query
        const query = {};
        if (keyword) {
          query.name = { $regex: keyword, $options: "i" };
        }
        if (typeof is_delete !== "undefined") {
          query.is_deleted = is_delete;
        }

        // Tổng số mục và số trang
        const totalItems = await CategoryModel.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        // Lấy danh sách danh mục
        const categories = await CategoryModel.find(query)
          .skip((pageNum - 1) * pageSize)
          .limit(pageSize);

        const formattedCategories = categories.map((category) => ({
          _id: category._id,
          name: category.name,
          description: category.description,
          is_deleted: category.is_deleted,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        }));

        resolve({
          status: 200,
          ok: true,
          message: "Lấy danh sách danh mục thành công",
          data: {
            pageData: formattedCategories,
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
          message: error.message || "Lỗi khi lấy danh sách danh mục",
        });
      }
    }),
      // Lấy danh mục theo ID
  getCategoryByIdService: (id) =>
    new Promise(async (resolve, reject) => {
      try {
        const category = await CategoryModel.findById(id);

        if (!category) {
          return reject({
            status: 404,
            ok: false,
            message: "Danh mục không tồn tại",
          });
        }

        resolve({
          status: 200,
          ok: true,
          message: "Lấy danh mục thành công",
          data: category,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy danh mục. " + error.message,
        });
      }
    }),

  // Cập nhật danh mục
  updateCategoryService: (id, { name, description }) =>
    new Promise(async (resolve, reject) => {
      try {
        const updatedCategory = await CategoryModel.findByIdAndUpdate(
          id,
          { name, description },
          { new: true, runValidators: true } // Trả về document sau khi cập nhật
        );

        if (!updatedCategory) {
          return reject({
            status: 404,
            ok: false,
            message: "Danh mục không tồn tại",
          });
        }

        resolve({
          status: 200,
          ok: true,
          message: "Cập nhật danh mục thành công",
          data: updatedCategory,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi cập nhật danh mục. " + error.message,
        });
      }
    }),

  // Xóa mềm danh mục
  deleteCategoryService: (id) =>
    new Promise(async (resolve, reject) => {
      try {
        const deletedCategory = await CategoryModel.findByIdAndUpdate(
          id,
          { is_deleted: true },
          { new: true } // Trả về document sau khi cập nhật
        );

        if (!deletedCategory) {
          return reject({
            status: 404,
            ok: false,
            message: "Danh mục không tồn tại",
          });
        }

        resolve({
          status: 200,
          ok: true,
          message: "Xóa danh mục thành công (xóa mềm)",
          data: deletedCategory,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi xóa danh mục. " + error.message,
        });
      }
    }),
};
