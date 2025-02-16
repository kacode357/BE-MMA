const express = require("express");
const UserController = require("../controllers/user.controller");
const router = express.Router();

router.post("/users", UserController.createUserController);
router.post("/users/login", UserController.loginUserController);
router.post("/users/refresh-token", UserController.refreshTokenController);
module.exports = router;
