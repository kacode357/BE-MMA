const CategoryModel = require("../models/category.model");

module.exports = {
  createCategoryService: (categoryData) =>
    new Promise(async (resolve, reject) => {
      try {
        const newCategory = await CategoryModel.create(categoryData);
        resolve({
          status: 201,
          ok: true,
          message: "Tạo danh mục thành công",
          category: newCategory,
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

  getAllCategoriesService: () =>
    new Promise(async (resolve, reject) => {
      try {
        const categories = await CategoryModel.find({});
        resolve({
          status: 200,
          ok: true,
          categories,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lấy danh sách danh mục thất bại. Lỗi: " + error.message,
        });
      }
    }),

  getCategoryByIdService: (id) =>
    new Promise(async (resolve, reject) => {
      try {
        const category = await CategoryModel.findById(id);
        if (!category) {
          reject({
            status: 404,
            ok: false,
            message: "Không tìm thấy danh mục với ID: " + id,
          });
        } else {
          resolve({
            status: 200,
            ok: true,
            category,
          });
        }
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lấy danh mục thất bại. Lỗi: " + error.message,
        });
      }
    }),

  updateCategoryService: (id, updateData) =>
    new Promise(async (resolve, reject) => {
      try {
        const updatedCategory = await CategoryModel.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });
        if (!updatedCategory) {
          reject({
            status: 404,
            ok: false,
            message: "Không tìm thấy danh mục với ID: " + id + " để cập nhật.",
          });
        } else {
          resolve({
            status: 200,
            ok: true,
            message: "Cập nhật danh mục thành công.",
            category: updatedCategory,
          });
        }
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Cập nhật danh mục thất bại. Lỗi: " + error.message,
        });
      }
    }),

  deleteCategoryService: (id) =>
    new Promise(async (resolve, reject) => {
      try {
        const deletedCategory = await CategoryModel.findByIdAndDelete(id);
        if (!deletedCategory) {
          reject({
            status: 404,
            ok: false,
            message: "Không tìm thấy danh mục với ID: " + id + " để xóa.",
          });
        } else {
          resolve({
            status: 200,
            ok: true,
            message: "Xóa danh mục thành công.",
          });
        }
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Xóa danh mục thất bại. Lỗi: " + error.message,
        });
      }
    }),
};
