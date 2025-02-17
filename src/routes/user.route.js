const express = require("express");
const UserController = require("../controllers/user.controller");
const router = express.Router();

router.post("/users", UserController.createUserController);
router.post("/users/login", UserController.loginUserController);
router.post("/users/refresh-token", UserController.refreshTokenController);
router.get("/users/my-location", UserController.getMyLocationController);

module.exports = router;
