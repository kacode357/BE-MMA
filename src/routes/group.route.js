const express = require("express");
const GroupController = require("../controllers/group.controller");
const router = express.Router();


router.post("/create-group",  GroupController.createGroupController);
router.post("/add-member/:groupId", GroupController.addMemberToGroupController);
router.put("/update-role-member", GroupController.updateRoleMember);
router.get("/get-all-group", GroupController.getGroups);
module.exports = router;
