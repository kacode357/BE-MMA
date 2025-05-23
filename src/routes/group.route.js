const express = require("express");
const GroupController = require("../controllers/group.controller");
const auth = require("../middleware/auth");
const router = express.Router();

// Tạo nhóm
router.post("/groups", auth, GroupController.createGroupController);
router.get("/groups/:id", auth, GroupController.getGroupByIdController);


module.exports = router;