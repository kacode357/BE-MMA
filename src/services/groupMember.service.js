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
};