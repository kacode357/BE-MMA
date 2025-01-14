const Cart = require("../models/cart.model");
const Food = require("../models/food.model");

// Kiểm tra và thêm sản phẩm vào giỏ hàng
const addToCart = async (foodId, quantity) => {
    // Kiểm tra sản phẩm có tồn tại không
    const food = await Food.findById(foodId);
    if (!food) {
        throw new Error("Sản phẩm không tồn tại");
    }

    // Tìm giỏ hàng active (chỉ có một giỏ hàng active cho POS)
    let cart = await Cart.findOne({ status: "active" });

    if (!cart) {
        // Nếu giỏ hàng chưa tồn tại, tạo mới
        cart = new Cart({
            items: [],
            totalPrice: 0,
        });
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingItem = cart.items.find(item => item.foodId.toString() === foodId);

    if (existingItem) {
        // Cập nhật số lượng
        existingItem.quantity += quantity;
        // Cập nhật giá theo số lượng mới
        existingItem.price = existingItem.quantity * food.price;
    } else {
        // Thêm sản phẩm mới vào giỏ hàng
        cart.items.push({
            foodId,
            quantity,
            price: food.price * quantity,
        });
    }

    // Tính lại tổng giá trị giỏ hàng
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);

    // Lưu giỏ hàng
    await cart.save();

    return cart;
};
const updateQuantity = async (foodId, quantity) => {
    if (quantity < 1) {
        throw new Error("Số lượng phải lớn hơn hoặc bằng 1");
    }

    // Tìm giỏ hàng active (chỉ có một giỏ hàng active cho POS)
    const cart = await Cart.findOne({ status: "active" });

    if (!cart) {
        throw new Error("Giỏ hàng không tồn tại");
    }

    // Tìm sản phẩm trong giỏ hàng
    const item = cart.items.find(item => item.foodId.toString() === foodId);

    if (!item) {
        throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    // Cập nhật số lượng và giá
    const food = await Food.findById(foodId);
    if (!food) {
        throw new Error("Sản phẩm không tồn tại");
    }

    item.quantity = quantity;
    item.price = item.quantity * food.price;

    // Tính lại tổng giá trị giỏ hàng
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);

    // Lưu giỏ hàng
    await cart.save();

    return cart;
};
const removeFromCart = async (foodId) => {
    // Tìm giỏ hàng active (chỉ có một giỏ hàng active cho POS)
    const cart = await Cart.findOne({ status: "active" });

    if (!cart) {
        throw new Error("Giỏ hàng không tồn tại");
    }

    // Kiểm tra xem sản phẩm có trong giỏ hàng hay không
    const itemIndex = cart.items.findIndex(item => item.foodId.toString() === foodId);

    if (itemIndex === -1) {
        throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    // Xóa sản phẩm khỏi giỏ hàng
    cart.items.splice(itemIndex, 1);

    // Tính lại tổng giá trị giỏ hàng
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);

    // Lưu giỏ hàng
    await cart.save();

    return cart;
};
const clearCart = async () => {
    // Tìm giỏ hàng active
    const cart = await Cart.findOne({ status: "active" });
  
    if (!cart) {
      throw new Error("Giỏ hàng không tồn tại");
    }
  
    // Xóa toàn bộ sản phẩm và đặt lại totalPrice
    cart.items = [];
    cart.totalPrice = 0;
  
    // Lưu giỏ hàng
    await cart.save();
  
    return cart;
  };
  const getCart = async () => {
    // Tìm giỏ hàng active (chỉ có một giỏ hàng active cho POS)
    const cart = await Cart.findOne({ status: "active" }).populate("items.foodId");
  
    if (!cart) {
      throw new Error("Giỏ hàng không tồn tại");
    }
  
    return cart;
  };
  const deleteCart = async () => {
    // Tìm giỏ hàng active
    const cart = await Cart.findOne({ status: "active" });
  
    if (!cart) {
      throw new Error("Giỏ hàng không tồn tại");
    }
  
    // Xóa giỏ hàng
    await Cart.deleteOne({ _id: cart._id });
  
    return;
  };
module.exports = {
    deleteCart,
    getCart,
    clearCart,
    removeFromCart,
    updateQuantity,
    addToCart,
};
