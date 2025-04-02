const express = require("express");
const OrderController = require("../controllers/order.controller");
const router = express.Router();

// API tạo đơn hàng
router.post("/orders", OrderController.createOrderController);
router.get("/orders", OrderController.getOrdersController);
router.get("/orders/:orderId", OrderController.getOrderByIdController);
router.put("/orders/items", OrderController.updateFoodQuantityController);
router.put("/orders/items/increase", OrderController.increaseFoodQuantityController);
router.put("/orders/items/decrease", OrderController.decreaseFoodQuantityController);
router.post("/dashboard/orders/search", OrderController.searchDashboardOrdersController);
module.exports = router;
