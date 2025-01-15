const express = require("express");
const CartController = require("../controllers/cart.controller"); // Import CartController
const router = express.Router();

// Thêm sản phẩm vào giỏ hàng
router.post("/cart", CartController.addToCartController);
router.put("/cart", CartController.updateQuantityController);
router.delete("/cart", CartController.removeFromCartController);
router.delete("/cart/clear", CartController.clearCartController);
router.get("/cart", CartController.getCartController);
router.delete("/cart/delete", CartController.deleteCartController);
router.get("/cart/:id", CartController.getCartByIdController);
module.exports = router;
