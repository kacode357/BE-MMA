const PackageModel = require("../models/package.model");
const UserModel = require("../models/user.model");
const PurchaseModel = require("../models/purchase.model");
const GroupMemberModel = require("../models/groupMember.model");

module.exports = {
  createPackageService: (packageData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { package_name, description, price, img_url, user_id } = packageData;

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

        const package = await PackageModel.findById(package_id);
        if (!package) {
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
                package_id: package._id,
                package_name: package.package_name,
                description: package.description,
                price: package.price,
                img_url: package.img_url,
                created_at: package.created_at,
              },
            },
          });
        }

        // Kiểm tra gói miễn phí
        if (package.price === 0) {
          return resolve({
            status: 200,
            message: "Có quyền sử dụng gói miễn phí",
            data: {
              has_access: true,
              package: {
                package_id: package._id,
                package_name: package.package_name,
                description: package.description,
                price: package.price,
                img_url: package.img_url,
                created_at: package.created_at,
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
                package_id: package._id,
                package_name: package.package_name,
                description: package.description,
                price: package.price,
                img_url: package.img_url,
                created_at: package.created_at,
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
                package_id: package._id,
                package_name: package.package_name,
                description: package.description,
                price: package.price,
                img_url: package.img_url,
                created_at: package.created_at,
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
                { package_name: { $regex: keyword, $options: 'i' } }, // Tìm kiếm theo package_name (không phân biệt hoa thường)
                { description: { $regex: keyword, $options: 'i' } },  // Tìm kiếm theo description
              ],
            },
            { is_delete: is_delete }, // Lọc theo is_delete
          ],
        };

        // Tính toán phân trang
        const skip = (pageNum - 1) * pageSize;
        const limit = pageSize;

        // Lấy danh sách gói
        const packages = await PackageModel.find(searchQuery)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 }); // Sắp xếp theo thời gian tạo mới nhất

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
};