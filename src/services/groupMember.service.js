const GroupMemberModel = require("../models/groupMember.model");
const GroupModel = require("../models/group.model");
const UserModel = require("../models/user.model");

module.exports = {
  addGroupMemberService: (memberData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_id, user_id, owner_id } = memberData;

        // Validate required fields
        if (!group_id || !user_id || !owner_id) {
          return reject({
            status: 400,
            ok: false,
            message: "group_id, user_id và owner_id là bắt buộc",
          });
        }

        // Kiểm tra owner tồn tại và có role = premium
        const owner = await UserModel.findById(owner_id);
        if (!owner) {
          return reject({
            status: 404,
            ok: false,
            message: "Owner không tồn tại",
          });
        }
        if (owner.role !== "premium") {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ user Premium mới được thêm thành viên nhóm",
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

        // Kiểm tra group tồn tại và owner_id khớp
        const group = await GroupModel.findById(group_id);
        if (!group) {
          return reject({
            status: 404,
            ok: false,
            message: "Nhóm không tồn tại",
          });
        }
        if (group.owner_id.toString() !== owner_id) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không phải owner của nhóm",
          });
        }

        // Kiểm tra số lượng thành viên (tối đa 3, bao gồm owner)
        const memberCount = await GroupMemberModel.countDocuments({ group_id });
        if (memberCount >= 2) {
          return reject({
            status: 403,
            ok: false,
            message: "Nhóm đã đạt tối đa 3 thành viên (bao gồm owner).",
          });
        }

        // Kiểm tra user đã là thành viên của nhóm hiện tại
        const existingMember = await GroupMemberModel.findOne({ group_id, user_id });
        if (existingMember) {
          return reject({
            status: 400,
            ok: false,
            message: "Người dùng đã là thành viên của nhóm này",
          });
        }

        // Kiểm tra user đã tham gia nhóm khác
        const userInOtherGroup = await GroupMemberModel.findOne({ user_id });
        if (userInOtherGroup) {
          return reject({
            status: 400,
            ok: false,
            message: "Người dùng đã là thành viên của một nhóm khác",
          });
        }

        // Thêm thành viên vào nhóm
        await GroupMemberModel.create({
          group_id,
          user_id,
        });

        // Cập nhật role = premium cho thành viên
        user.role = "premium";
        await user.save();

        resolve({
          status: 201,
          ok: true,
          message: "Thêm thành viên nhóm thành công",
          data: {
            group_id,
            user_id,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi thêm thành viên nhóm: " + error.message,
        });
      }
    }),

  getAllGroupMembersService: (req, searchCondition = {}, pageInfo = {}) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_id = "", keyword = "" } = searchCondition;
        const { pageNum = 1, pageSize = 10 } = pageInfo;

        const userRole = req.user.role;
        const userId = req.user._id;

        // Validate role
        if (!["admin", "user", "premium"].includes(userRole)) {
          return reject({
            status: 403,
            ok: false,
            message: "Quyền không hợp lệ. Chỉ admin, user hoặc premium được phép tìm kiếm.",
          });
        }

        // Validate group_id if provided
        if (!group_id) {
          return reject({
            status: 400,
            ok: false,
            message: "group_id là bắt buộc để tìm kiếm thành viên nhóm",
          });
        }

        const group = await GroupModel.findById(group_id);
        if (!group) {
          return reject({
            status: 404,
            ok: false,
            message: "Nhóm không tồn tại",
          });
        }

        // Kiểm tra xem user có phải là owner hoặc thành viên của nhóm
        const isOwner = group.owner_id.toString() === userId.toString();
        const isMember = await GroupMemberModel.exists({ group_id, user_id: userId });

        if (!isOwner && !isMember && userRole !== "admin") {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không có quyền xem thành viên của nhóm này",
          });
        }

        const query = { group_id };

        // Search by username if keyword is provided
        if (keyword) {
          const users = await UserModel.find({
            username: { $regex: keyword, $options: "i" },
          }).select("_id");
          query.user_id = { $in: users.map((user) => user._id) };
        }

        const skip = (pageNum - 1) * pageSize;
        const totalItems = await GroupMemberModel.countDocuments(query);
        const members = await GroupMemberModel.find(query)
          .populate("user_id", "username")
          .populate("group_id", "group_name")
          .skip(skip)
          .limit(pageSize)
          .lean();

        const totalPages = Math.ceil(totalItems / pageSize);

        const pageData = members.map((member) => ({
          group_id: member.group_id._id,
          group_name: member.group_id.group_name,
          user_id: member.user_id._id,
          username: member.user_id.username,
          created_at: member.created_at,
        }));

        resolve({
          status: 200,
          ok: true,
          message: "Tìm kiếm thành viên nhóm thành công",
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
          message: "Lỗi khi tìm kiếm thành viên nhóm: " + error.message,
        });
      }
    }),

  deleteGroupMemberService: (req, memberData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_id, user_id } = memberData;
        const userRole = req.user.role;
        const currentUserId = req.user._id;

        // Validate required fields
        if (!group_id || !user_id) {
          return reject({
            status: 400,
            ok: false,
            message: "group_id và user_id là bắt buộc",
          });
        }

        // Validate role
        if (!["admin", "premium"].includes(userRole)) {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ admin hoặc user premium (owner) được phép xóa thành viên nhóm",
          });
        }

        // Check if group exists
        const group = await GroupModel.findById(group_id);
        if (!group) {
          return reject({
            status: 404,
            ok: false,
            message: "Nhóm không tồn tại",
          });
        }

        // Check if user exists
        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        // Check if the current user is the group owner (unless admin)
        const isOwner = group.owner_id.toString() === currentUserId.toString();
        if (!isOwner && userRole !== "admin") {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không phải owner của nhóm",
          });
        }

        // Check if the user to be deleted is a member of the group
        const existingMember = await GroupMemberModel.findOne({ group_id, user_id });
        if (!existingMember) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không phải là thành viên của nhóm này",
          });
        }

        // Prevent deleting the owner
        if (group.owner_id.toString() === user_id) {
          return reject({
            status: 403,
            ok: false,
            message: "Không thể xóa owner của nhóm",
          });
        }

        // Delete the group member
        await GroupMemberModel.deleteOne({ group_id, user_id });

        // Revert user's role to 'user' (assuming they were premium due to group membership)
        user.role = "user";
        await user.save();

        resolve({
          status: 200,
          ok: true,
          message: "Xóa thành viên nhóm thành công",
          data: {
            group_id,
            user_id,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi xóa thành viên nhóm: " + error.message,
        });
      }
    }),
};