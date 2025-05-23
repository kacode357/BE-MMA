const express = require("express");
const GroupController = require("../controllers/group.controller");
const auth = require("../middleware/auth");
const router = express.Router();

// Tạo nhóm
router.post("/groups", auth, GroupController.createGroupController);
// Lấy nhóm theo ID
router.get("/groups/:id", auth, GroupController.getGroupByIdController);
// Tìm kiếm tất cả nhóm
router.post("/groups/search", auth, GroupController.getAllGroupsController);

module.exports = router;