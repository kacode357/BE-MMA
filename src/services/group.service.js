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
        const packageData = await PackageModel.findById(package_id);
        if (!packageData) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }

        // Gói miễn phí: Cho phép tạo nhóm nếu user có role = premium
        if (packageData.price === 0) {
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

  getAllGroupsService: (req, searchCondition = {}, pageInfo = {}) =>
    new Promise(async (resolve, reject) => {
      try {
        const { keyword = '', status = '' } = searchCondition;
        const { pageNum = 1, pageSize = 10 } = pageInfo;

        const userRole = req.user.role;
        console.log('User role in getAllGroupsService:', userRole);

        if (!["admin", "user", "premium"].includes(userRole)) {
          return reject({
            status: 403,
            ok: false,
            message: "Quyền không hợp lệ. Chỉ admin hoặc user mới được phép tìm kiếm.",
          });
        }

        const query = {};
        if (userRole === 'user') {
          query.owner_id = req.user._id;
        }

        if (keyword) {
          query.group_name = { $regex: keyword, $options: 'i' };
        }

        if (status) {
          query.status = { $in: [status] };
        }

        const skip = (pageNum - 1) * pageSize;
        const totalItems = await GroupModel.countDocuments(query);
        const groups = await GroupModel.find(query)
          .populate('owner_id', 'username')
          .populate('package_id', 'package_name price is_premium')
          .skip(skip)
          .limit(pageSize)
          .lean();

        const totalPages = Math.ceil(totalItems / pageSize);

        const pageData = groups.map(group => ({
          group_id: group._id,
          group_name: group.group_name,
          owner_id: group.owner_id._id,
          owner_username: group.owner_id.username,
          package_id: group.package_id._id,
          package_name: group.package_id.package_name,
          price: group.package_id.price,
          is_premium: group.package_id.is_premium,
          created_at: group.created_at,
        }));

        resolve({
          status: 200,
          ok: true,
          message: "Tìm kiếm nhóm thành công",
          data: {
            pageData,
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
          message: "Lỗi khi tìm kiếm nhóm: " + error.message,
        });
      }
    }),

  getGroupByIdService: (groupId, user) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!groupId) {
          return reject({
            status: 400,
            ok: false,
            message: "group_id là bắt buộc",
          });
        }

        const group = await GroupModel.findById(groupId)
          .populate('owner_id', 'username')
          .populate('package_id', 'package_name price is_premium')
          .lean();

        if (!group) {
          return reject({
            status: 404,
            ok: false,
            message: "Nhóm không tồn tại",
          });
        }

        if (user.role !== 'admin' && group.owner_id._id.toString() !== user._id.toString()) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không có quyền xem thông tin nhóm này",
          });
        }

        const groupData = {
          group_id: group._id,
          group_name: group.group_name,
          owner_id: group.owner_id._id,
          owner_username: group.owner_id.username,
          package_id: group.package_id._id,
          package_name: group.package_id.package_name,
          price: group.package_id.price,
          is_premium: group.package_id.is_premium,
          created_at: group.created_at,
        };

        resolve({
          status: 200,
          ok: true,
          message: "Lấy thông tin nhóm thành công",
          data: groupData,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy thông tin nhóm: " + error.message,
        });
      }
    }),

  updateGroupService: (groupId, updateData, user) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_name, package_id } = updateData;

        if (!groupId) {
          return reject({
            status: 400,
            ok: false,
            message: "group_id là bắt buộc",
          });
        }

        const group = await GroupModel.findById(groupId);
        if (!group) {
          return reject({
            status: 404,
            ok: false,
            message: "Nhóm không tồn tại",
          });
        }

        if (user.role !== 'admin' && group.owner_id.toString() !== user._id.toString()) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không có quyền cập nhật nhóm này",
          });
        }

        if (group_name) {
          group.group_name = group_name;
        }

        if (package_id) {
          const packageData = await PackageModel.findById(package_id);
          if (!packageData) {
            return reject({
              status: 404,
              ok: false,
              message: "Gói không tồn tại",
            });
          }

          if (packageData.price > 0) {
            return reject({
              status: 403,
              ok: false,
              message: "Không thể cập nhật sang gói trả phí trực tiếp",
            });
          }

          group.package_id = package_id;
        }

        await group.save();

        const updatedGroup = await GroupModel.findById(groupId)
          .populate('owner_id', 'username')
          .populate('package_id', 'package_name price is_premium')
          .lean();

        const groupData = {
          group_id: updatedGroup._id,
          group_name: updatedGroup.group_name,
          owner_id: updatedGroup.owner_id._id,
          owner_username: updatedGroup.owner_id.username,
          package_id: updatedGroup.package_id._id,
          package_name: updatedGroup.package_id.package_name,
          price: updatedGroup.package_id.price,
          is_premium: updatedGroup.package_id.is_premium,
          created_at: updatedGroup.created_at,
        };

        resolve({
          status: 200,
          ok: true,
          message: "Cập nhật nhóm thành công",
          data: groupData,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi cập nhật nhóm: " + error.message,
        });
      }
    }),

  deleteGroupService: (groupId, user) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!groupId) {
          return reject({
            status: 400,
            ok: false,
            message: "group_id là bắt buộc",
          });
        }

        const group = await GroupModel.findById(groupId);
        if (!group) {
          return reject({
            status: 404,
            ok: false,
            message: "Nhóm không tồn tại",
          });
        }

        if (user.role !== 'admin' && group.owner_id.toString() !== user._id.toString()) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không có quyền xóa nhóm này",
          });
        }

        await GroupModel.deleteOne({ _id: groupId });

        await PurchaseModel.updateMany({ group_id: groupId }, { $unset: { group_id: "" } });

        resolve({
          status: 200,
          ok: true,
          message: "Xóa nhóm thành công",
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi xóa nhóm: " + error.message,
        });
      }
    }),
};