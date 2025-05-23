const PackageModel = require("../models/package.model");
const UserModel = require("../models/user.model");
const PurchaseModel = require("../models/purchase.model");
const GroupMemberModel = require("../models/groupMember.model");

module.exports = {
  createPackageService: (packageData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { package_name, description, price, img_url, user_id, is_premium } = packageData;

        if (!user_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user || user.role !== "admin") {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ admin mới có thể tạo gói",
          });
        }

        if (!package_name || price == null) {
          return reject({
            status: 400,
            ok: false,
            message: "Tên gói và giá là bắt buộc",
          });
        }

        if (price < 0) {
          return reject({
            status: 400,
            ok: false,
            message: "Giá phải lớn hơn hoặc bằng 0",
          });
        }

        const newPackage = await PackageModel.create({
          package_name,
          description,
          price,
          img_url,
          is_premium: is_premium || false, // Gán giá trị is_premium, mặc định là false nếu không truyền
        });

        resolve({
          status: 201,
          message: "Tạo gói thành công",
          data: {
            package_id: newPackage._id,
            package_name: newPackage.package_name,
            description: newPackage.description,
            price: newPackage.price,
            img_url: newPackage.img_url,
            created_at: newPackage.created_at,
            is_delete: newPackage.is_delete,
            is_premium: newPackage.is_premium, // Thêm is_premium vào response
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tạo gói: " + error.message,
        });
      }
    }),

  checkPackageAccessService: ({ user_id, package_id }) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!user_id || !package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id và package_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        const packageData = await PackageModel.findById(package_id);
        if (!packageData) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }

        // User có role = premium: Truy cập tất cả gói AI
        if (user.role === "premium") {
          return resolve({
            status: 200,
            message: "Có quyền sử dụng gói với role Premium",
            data: {
              has_access: true,
              package: {
                package_id: packageData._id,
                package_name: packageData.package_name,
                description: packageData.description,
                price: packageData.price,
                img_url: packageData.img_url,
                created_at: packageData.created_at,
                is_premium: packageData.is_premium, // Thêm is_premium vào response
              },
            },
          });
        }

        // Kiểm tra gói miễn phí
        if (packageData.price === 0) {
          return resolve({
            status: 200,
            message: "Có quyền sử dụng gói miễn phí",
            data: {
              has_access: true,
              package: {
                package_id: packageData._id,
                package_name: packageData.package_name,
                description: packageData.description,
                price: packageData.price,
                img_url: packageData.img_url,
                created_at: packageData.created_at,
                is_premium: packageData.is_premium, // Thêm is_premium vào response
              },
            },
          });
        }

        // Kiểm tra gói trả phí
        const purchase = await PurchaseModel.findOne({
          user_id,
          package_id,
          status: "completed",
        });
        if (purchase) {
          return resolve({
            status: 200,
            message: "Có quyền sử dụng gói đã mua",
            data: {
              has_access: true,
              package: {
                package_id: packageData._id,
                package_name: packageData.package_name,
                description: packageData.description,
                price: packageData.price,
                img_url: packageData.img_url,
                created_at: packageData.created_at,
                is_premium: packageData.is_premium, // Thêm is_premium vào response
              },
            },
          });
        }

        // Kiểm tra quyền qua nhóm
        const groupMember = await GroupMemberModel.findOne({
          user_id,
          group_id: { $in: (await PurchaseModel.find({ package_id, status: "completed" })).map(p => p.group_id) },
        });
        if (groupMember) {
          return resolve({
            status: 200,
            message: "Có quyền sử dụng gói qua nhóm",
            data: {
              has_access: true,
              package: {
                package_id: packageData._id,
                package_name: packageData.package_name,
                description: packageData.description,
                price: packageData.price,
                img_url: packageData.img_url,
                created_at: packageData.created_at,
                is_premium: packageData.is_premium, // Thêm is_premium vào response
              },
            },
          });
        }

        return reject({
          status: 403,
          ok: false,
          message: "Không có quyền sử dụng gói",
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi kiểm tra quyền sử dụng gói: " + error.message,
        });
      }
    }),

  getAllPackagesService: ({ searchCondition, pageInfo }) =>
    new Promise(async (resolve, reject) => {
      try {
        const { keyword = '', is_delete = false } = searchCondition || {};
        const { pageNum = 1, pageSize = 10 } = pageInfo || {};

        // Validate pageNum và pageSize
        if (!Number.isInteger(pageNum) || pageNum < 1) {
          return reject({
            status: 400,
            ok: false,
            message: "pageNum phải là số nguyên dương",
          });
        }

        if (!Number.isInteger(pageSize) || pageSize < 1) {
          return reject({
            status: 400,
            ok: false,
            message: "pageSize phải là số nguyên dương",
          });
        }

        // Tạo điều kiện tìm kiếm
        const searchQuery = {
          $and: [
            {
              $or: [
                { package_name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
              ],
            },
            { is_delete: is_delete },
          ],
        };

        // Tính toán phân trang
        const skip = (pageNum - 1) * pageSize;
        const limit = pageSize;

        // Lấy danh sách gói
        const packages = await PackageModel.find(searchQuery)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 });

        // Lấy tổng số gói phù hợp
        const total = await PackageModel.countDocuments(searchQuery);

        // Tính tổng số trang
        const totalPages = Math.ceil(total / pageSize);

        // Format dữ liệu trả về
        const packageList = packages.map(pkg => ({
          package_id: pkg._id,
          package_name: pkg.package_name,
          description: pkg.description,
          price: pkg.price,
          img_url: pkg.img_url,
          created_at: pkg.created_at,
          is_delete: pkg.is_delete,
          is_premium: pkg.is_premium, // Thêm is_premium vào response
        }));

        resolve({
          status: 200,
          message: "Lấy danh sách gói thành công",
          data: {
            pageData: packageList,
            pageInfo: {
              pageNum,
              pageSize,
              total,
              totalPages,
            },
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy danh sách gói: " + error.message,
        });
      }
    }),

  getPackageByIdService: ({ package_id }) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "package_id là bắt buộc",
          });
        }

        const packageData = await PackageModel.findById(package_id);
        if (!packageData) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }

        resolve({
          status: 200,
          message: "Lấy thông tin gói thành công",
          data: {
            package_id: packageData._id,
            package_name: packageData.package_name,
            description: packageData.description,
            price: packageData.price,
            img_url: packageData.img_url,
            created_at: packageData.created_at,
            is_delete: packageData.is_delete,
            is_premium: packageData.is_premium, // Thêm is_premium vào response
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy thông tin gói: " + error.message,
        });
      }
    }),

  updatePackageService: ({ package_id, package_name, description, price, img_url, user_id, is_premium }) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "package_id là bắt buộc",
          });
        }

        if (!user_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user || user.role !== "admin") {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ admin mới có thể cập nhật gói",
          });
        }

        const packageData = await PackageModel.findById(package_id);
        if (!packageData) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }
        if (package_name) {
          const existingPackage = await PackageModel.findOne({
            package_name,
            is_delete: false,
            _id: { $ne: package_id },
          });
          if (existingPackage) {
            return reject({
              status: 409,
              ok: false,
              message: "Tên gói đã tồn tại",
            });
          }
        }
        if (packageData.is_delete) {
          return reject({
            status: 400,
            ok: false,
            message: "Gói đã bị xóa, không thể cập nhật",
          });
        }

        // Cập nhật các trường nếu được cung cấp
        if (package_name) packageData.package_name = package_name;
        if (description !== undefined) packageData.description = description;
        if (price !== undefined) {
          if (price < 0) {
            return reject({
              status: 400,
              ok: false,
              message: "Giá phải lớn hơn hoặc bằng 0",
            });
          }
          packageData.price = price;
        }
        if (img_url !== undefined) packageData.img_url = img_url;
        if (is_premium !== undefined) packageData.is_premium = is_premium; // Cập nhật is_premium nếu được truyền

        await packageData.save();

        resolve({
          status: 200,
          message: "Cập nhật gói thành công",
          data: {
            package_id: packageData._id,
            package_name: packageData.package_name,
            description: packageData.description,
            price: packageData.price,
            img_url: packageData.img_url,
            created_at: packageData.created_at,
            is_delete: packageData.is_delete,
            is_premium: packageData.is_premium, // Thêm is_premium vào response
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi cập nhật gói: " + error.message,
        });
      }
    }),

  softDeletePackageService: ({ package_id, user_id }) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "package_id là bắt buộc",
          });
        }

        if (!user_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user || user.role !== "admin") {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ admin mới có thể xóa gói",
          });
        }

        const packageData = await PackageModel.findById(package_id);
        if (!packageData) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }

        if (packageData.is_delete) {
          return reject({
            status: 400,
            ok: false,
            message: "Gói đã bị xóa trước đó",
          });
        }

        // Cập nhật is_delete thành true
        packageData.is_delete = true;
        await packageData.save();

        resolve({
          status: 200,
          message: "Xóa gói thành công",
          data: {
            package_id: packageData._id,
            package_name: packageData.package_name,
            description: packageData.description,
            price: packageData.price,
            img_url: packageData.img_url,
            created_at: packageData.created_at,
            is_delete: packageData.is_delete,
            is_premium: packageData.is_premium, // Thêm is_premium vào response
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi xóa mềm gói: " + error.message,
        });
      }
    }),
};