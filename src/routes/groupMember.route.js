const express = require("express");
const GroupMemberController = require("../controllers/groupMember.controller");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/group-members", auth, GroupMemberController.addGroupMemberController);
router.post("/group-members/search", auth, GroupMemberController.getAllGroupMembersController);

module.exports = router;