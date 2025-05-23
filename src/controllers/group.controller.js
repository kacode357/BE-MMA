const { createGroupService, getAllGroupsService } = require("../services/group.service");

module.exports = {
  createGroupController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { group_name, owner_id, package_id, purchase_id } = req.body;

        const result = await createGroupService({
          group_name,
          owner_id,
          package_id,
          purchase_id,
        });

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi tạo nhóm",
        });
      }
    }),

  
};