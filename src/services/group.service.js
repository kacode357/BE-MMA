const GroupModel = require("../models/group.model");
const UserModel = require("../models/user.model");
const PurchaseModel = require("../models/purchase.model");
const PackageModel = require("../models/package.model");

module.exports = {
  createGroupService: (groupData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_name, owner_id, package_id, purchase_id } = groupData;

        // Validate required fields
        if (!group_name || !owner_id || !package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "group_name, owner_id và package_id là bắt buộc",
          });
        }

        // Kiểm tra user tồn tại
        const user = await UserModel.findById(owner_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        // Kiểm tra xem user đã tạo nhóm nào chưa
        const existingGroup = await GroupModel.findOne({ owner_id });
        if (existingGroup) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn đã tạo một nhóm. Mỗi người chỉ được tạo một nhóm duy nhất.",
          });
        }

        // Kiểm tra package tồn tại
        const package = await PackageModel.findById(package_id);
        if (!package) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }

        // Gói miễn phí: Cho phép tạo nhóm nếu user có role = premium
        if (package.price === 0) {
          if (user.role !== "premium") {
            return reject({
              status: 403,
              ok: false,
              message: "Chỉ user Premium mới được tạo nhóm",
            });
          }

          const group = await GroupModel.create({
            group_name,
            owner_id,
            package_id,
          });

          return resolve({
            status: 201,
            ok: true,
            message: "Tạo nhóm thành công cho gói miễn phí",
            data: {
              group_id: group._id,
              group_name: group.group_name,
            },
          });
        }

        // Gói trả phí: Yêu cầu purchase_id và role = premium
        if (!purchase_id) {
          return reject({
            status: 400,
            ok: false,
            message: "purchase_id là bắt buộc cho gói trả phí",
          });
        }

        const purchase = await PurchaseModel.findById(purchase_id);
        if (!purchase) {
          return reject({
            status: 404,
            ok: false,
            message: "Giao dịch mua không tồn tại",
          });
        }
        if (purchase.user_id.toString() !== owner_id) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không phải người tạo giao dịch mua",
          });
        }
        if (purchase.package_id.toString() !== package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "Giao dịch mua không khớp với gói",
          });
        }
        if (purchase.status !== "completed") {
          return reject({
            status: 403,
            ok: false,
            message: "Giao dịch mua chưa được thanh toán thành công",
          });
        }
        if (user.role !== "premium") {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ user Premium mới được tạo nhóm",
          });
        }

        // Tạo nhóm
        const group = await GroupModel.create({
          group_name,
          owner_id,
          package_id,
        });

        // Cập nhật group_id trong purchase
        purchase.group_id = group._id;
        await purchase.save();

        resolve({
          status: 201,
          ok: true,
          message: "Tạo nhóm thành công",
          data: {
            group_id: group._id,
            group_name: group.group_name,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tạo nhóm: " + error.message,
        });
      }
    }),
};