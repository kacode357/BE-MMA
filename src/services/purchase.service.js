const PurchaseModel = require("../models/purchase.model");
const UserModel = require("../models/user.model");
const PackageModel = require("../models/package.model");

module.exports = {
  createPurchaseService: (purchaseData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, package_id } = purchaseData;

        // Validate required fields
        if (!user_id || !package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id và package_id là bắt buộc",
          });
        }

        // Kiểm tra user tồn tại
        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        // Kiểm tra package tồn tại và không miễn phí
        const package = await PackageModel.findById(package_id);
        if (!package) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }
        if (package.price === 0) {
          return reject({
            status: 400,
            ok: false,
            message: "Gói miễn phí không cần mua",
          });
        }

        // Tạo giao dịch mua với group_id = null
        const purchase = await PurchaseModel.create({
          user_id,
          package_id,
          group_id: null, // Sẽ cập nhật sau khi tạo nhóm
          status: "pending",
        });

        resolve({
          status: 201,
          ok: true,
          message: "Tạo giao dịch mua thành công",
          data: {
            purchase_id: purchase._id,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tạo giao dịch mua: " + error.message,
        });
      }
    }),
};