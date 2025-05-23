const { createGroupService, getGroupByIdService, getAllGroupsService } = require("../services/group.service");

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

  getGroupByIdController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { id } = req.params;
        const result = await getGroupByIdService(id, req.user);
        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi lấy thông tin nhóm",
        });
      }
    }),

  getAllGroupsController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { keyword, status, pageNum, pageSize } = req.query;
        const searchCondition = { keyword, status };
        const pageInfo = {
          pageNum: parseInt(pageNum) || 1,
          pageSize: parseInt(pageSize) || 10,
        };

        const result = await getAllGroupsService(req, searchCondition, pageInfo);
        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi tìm kiếm nhóm",
        });
      }
    }),
};