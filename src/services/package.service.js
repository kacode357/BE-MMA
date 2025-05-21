const PackageModel = require("../models/package.model");
const UserModel = require("../models/user.model");
const PurchaseModel = require("../models/purchase.model");
const GroupMemberModel = require("../models/groupMember.model");

module.exports = {
  createPackageService: (packageData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { package_name, description, price, user_id } = packageData;

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

        await PackageModel.create({
          package_name,
          description,
          price,
        });

        resolve({
          status: 201,
          ok: true,
          message: "Tạo gói thành công",
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
            ok: true,
            message: "Có quyền sử dụng gói với role Premium",
            data: { has_access: true },
          });
        }

        // Kiểm tra gói miễn phí
        if (package.price === 0) {
          return resolve({
            status: 200,
            ok: true,
            message: "Có quyền sử dụng gói miễn phí",
            data: { has_access: true },
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
            ok: true,
            message: "Có quyền sử dụng gói đã mua",
            data: { has_access: true },
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
            ok: true,
            message: "Có quyền sử dụng gói qua nhóm",
            data: { has_access: true },
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
};