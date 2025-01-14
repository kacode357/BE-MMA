const GroupModel = require("../models/group.model");
const UserModel = require("../models/user");
module.exports = {
  createGroupService: (groupName, ownerId, members) =>
    new Promise(async (resolve, reject) => {
      try {
        members = members || [];
        members.push({ memberId: ownerId, role: "edit" });
        const newGroup = await GroupModel.create({
          groupName,
          ownerId,
          members,
        });
        resolve({
          status: 201,
          ok: true,
          message: "Tạo nhóm thành công",
          group: newGroup,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Tạo thất bại",
        });
      }
    }),

  addMemberToGroupService: (groupId, userId) =>
    new Promise(async (resolve, reject) => {
      try {
        const group = await GroupModel.findById(groupId);
        if (!group) {
          reject({
            status: 404,
            ok: false,
            message: "Nhóm không tồn tại",
          });
        }
        const user = await UserModel.findById(userId);
        if (!user) {
          reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }
        if (group.members.includes(userId)) {
          reject({
            status: 400,
            ok: false,
            message: "Người dùng đã có trong nhóm",
          });
        }
        group.members.push(userId);
        const updatedGroup = await group.save();
        resolve({
          status: 201,
          ok: true,
          message: "Thêm thành viên thành công",
          group: updatedGroup,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Thêm thất bại",
        });
      }
    }),

  getAllGroupsService: () =>
    new Promise(async (resolve, reject) => {
      try {
        const groups = await GroupModel.find();
        resolve({
          status: 200,
          ok: true,
          message: "Lấy dữ liệu thành công",
          groups,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Lấy dữ liệu thất bại",
        });
      }
    }),

  updateRoleMemberService: (groupId, memberId, role, ownerId) =>
    new Promise(async (resolve, reject) => {
      try {
        const group = await GroupModel.findOne({ _id: groupId, ownerId });
        if (!group) {
          reject({
            status: 404,
            ok: false,
            message: "Không tìm thấy nhóm hoặc bạn không có quyền sửa",
          });
        }
        const memberIndex = group.members.findIndex(
          (member) => member._id == memberId
        );
        if (memberIndex === -1) {
          reject({
            status: 404,
            ok: false,
            message: "Thành viên không tìm thấy trong nhóm",
          });
        }
        group.members[memberIndex].role = role;
        await group.save();
        resolve({
          status: 200,
          ok: true,
          message: "Chỉnh chức vụ thành công",
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Tạo thất bại",
        });
      }
    }),
};
