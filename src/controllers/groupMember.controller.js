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
};