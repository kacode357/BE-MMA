const express = require("express");
const UserController = require("../controllers/user.controller");
const router = express.Router();

router.post("/users", UserController.createUserController);

module.exports = router;
