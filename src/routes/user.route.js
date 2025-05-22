const express = require("express");
const UserController = require("../controllers/user.controller");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/users", UserController.createUserController);
router.post("/users/login", UserController.loginUserController);
router.post("/users/refresh-token", UserController.resetTokenController);
router.get("/users/current", auth, UserController.getCurrentLoginController);
router.put("/users", auth, UserController.updateUserController); 
router.put("/users/password", auth, UserController.changePasswordController);

module.exports = router;