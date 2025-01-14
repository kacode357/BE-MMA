const express = require("express");
const GroupController = require("../controllers/food.controller");
const router = express.Router();


router.post("/foods", GroupController.createFoodController);
router.post("/foods/search", GroupController.getFoodsController);


module.exports = router;
