const express = require("express");
const UserController = require("../controllers/user.controller");
const auth = require("../middleware/auth"); // Nhập middleware auth
const router = express.Router();

router.post("/users", UserController.createUserController);
router.post("/users/login", UserController.loginUserController);
router.post("/users/refresh-token", UserController.resetTokenController);
router.get("/users/current", auth, UserController.getCurrentLoginController); // Áp dụng middleware auth

module.exports = router;