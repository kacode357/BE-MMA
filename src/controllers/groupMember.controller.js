const GroupMemberService = require("../services/groupMember.service");

module.exports = {
  addGroupMemberController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_id, user_id, owner_id } = req.body;

        const result = await GroupMemberService.addGroupMemberService({
          group_id,
          user_id,
          owner_id,
        });

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi thêm thành viên nhóm",
        });
      }
    }),

  getAllGroupMembersController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_id, keyword } = req.body;
        console.log("group_id", group_id);
        const { pageNum, pageSize } = req.query;

        const searchCondition = { group_id, keyword };
        const pageInfo = {
          pageNum: parseInt(pageNum) || 1,
          pageSize: parseInt(pageSize) || 10,
        };

        const result = await GroupMemberService.getAllGroupMembersService(req, searchCondition, pageInfo);
        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi tìm kiếm thành viên nhóm",
        });
      }
    }),

  deleteGroupMemberController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_id, user_id } = req.body;

        const result = await GroupMemberService.deleteGroupMemberService(req, {
          group_id,
          user_id,
        });

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi xóa thành viên nhóm",
        });
      }
    }),
};