const CartService = require("../services/cart.service");

const addToCartController = async (req, res) => {
    try {
        const { foodId, quantity } = req.body;

        // Gọi service để thêm sản phẩm vào giỏ hàng
        const cart = await CartService.addToCart(foodId, quantity);

        return res.status(200).json({ success: true, data: cart });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message || "Lỗi server" });
    }
};
const updateQuantityController = async (req, res) => {
    try {
        const { foodId, quantity } = req.body;

        // Gọi service để cập nhật số lượng sản phẩm trong giỏ hàng
        const cart = await CartService.updateQuantity(foodId, quantity);

        return res.status(200).json({ success: true, data: cart });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message || "Lỗi server" });
    }
};
const removeFromCartController = async (req, res) => {
    try {
      const { foodId } = req.body;
  
      // Gọi service để xóa sản phẩm khỏi giỏ hàng
      const cart = await CartService.removeFromCart(foodId);
  
      return res.status(200).json({ success: true, data: cart });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: error.message || "Lỗi server" });
    }
  };
  const clearCartController = async (req, res) => {
    try {
      // Gọi service để xóa toàn bộ giỏ hàng
      const result = await CartService.clearCart();
  
      return res.status(200).json({ success: true, message: "Giỏ hàng đã được xóa thành công", data: result });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: error.message || "Lỗi server" });
    }
  };
  const getCartController = async (req, res) => {
    try {
      // Gọi service để lấy thông tin giỏ hàng
      const cart = await CartService.getCart();
  
      return res.status(200).json({ success: true, data: cart });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: error.message || "Lỗi server" });
    }
  };
  const deleteCartController = async (req, res) => {
    try {
      // Gọi service để xóa toàn bộ giỏ hàng
      await CartService.deleteCart();
  
      return res.status(200).json({ success: true, message: "Giỏ hàng đã được xóa hoàn toàn" });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: error.message || "Lỗi server" });
    }
  };
module.exports = {
    deleteCartController,
    getCartController,
    clearCartController,
    removeFromCartController,
    updateQuantityController,
    addToCartController,
};