const express = require("express");
const GroupMemberController = require("../controllers/groupMember.controller");
const router = express.Router();

router.post("/group-members", GroupMemberController.addGroupMemberController);

module.exports = router;