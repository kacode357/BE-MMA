const express = require("express");
const UserController = require("../controllers/user.controller");
const router = express.Router();

router.post("/users", UserController.createUserController);
router.post("/users/login", UserController.loginUserController);
router.post("/users/refresh-token", UserController.refreshTokenController);
router.get("/users/my-location/:userid", UserController.getMyLocationController);
router.get("/users/:userid", UserController.getUserByIdController);
router.put("/users/:userid", UserController.updateUserController);
module.exports = router;
