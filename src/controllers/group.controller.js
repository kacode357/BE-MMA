const GroupService = require("../services/group.service");

module.exports = {
  createGroupController: async (req, res) => {
    try {
      const { groupName, members } = req.body;
      const ownerId = req.user._id;
      if (!groupName) {
        return res.status(400).json({ message: "Yêu cầu có tên nhóm" });
      }
      const result = await GroupService.createGroupService(
        groupName,
        ownerId,
        members
      );
      return res.status(201).json(result);
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ ok: false, message: "Lỗi server" });
    }
  },

  addMemberToGroupController: async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    try {
      const result = await GroupService.addMemberToGroupService(
        groupId,
        userId
      );
      return res.status(201).json(result);
    } catch (error) {
      const { status, message } = error;
      const errorResult = {
        ok: false,
        message: message || "Thêm thành viên thất bại",
      };
      return res.status(status || 500).json(errorResult);
    }
  },

  getGroups: async (req, res) => {
    try {
      const groups = await GroupService.getAllGroupsService();
      res.status(200).json(groups);
    } catch (error) {
      const { status, message } = error;
      const errorResult = {
        ok: false,
        message: message || "Lấy dữ liệu thất bại",
      };
      return res.status(status || 500).json(errorResult);
    }
  },

  updateRoleMember: async (req, res) => {
    try {
      const { groupId, memberId, role } = req.body;
      const ownerId = req.user._id;
      if (!["view", "edit"].includes(role)) {
        return res.status(400).json({
          message: "Truyền role không hợp lệ. Chỉ cập nhật view hoặc edit",
        });
      }
      const updatedGroup = await GroupService.updateRoleMemberService(
        groupId,
        memberId,
        role,
        ownerId
      );

      if (!updatedGroup) {
        return res.status(404).json({
          message: "Group or member not found or you do not have permission.",
        });
      }

      return res.status(200).json({
        updatedGroup,
      });
    } catch (error) {
      const { status, message } = error;
      const errorResult = {
        ok: false,
        message: message || "Lấy dữ liệu thất bại",
      };
      return res.status(status || 500).json(errorResult);
    }
  },
};
