const express = require("express");
const OrderController = require("../controllers/order.controller");
const router = express.Router();

// API tạo đơn hàng
router.post("/orders", OrderController.createOrderController);
router.get("/orders", OrderController.getOrdersController);
router.get("/orders/:orderId", OrderController.getOrderByIdController);
router.put("/orders/items", OrderController.updateFoodQuantityController);

module.exports = router;
