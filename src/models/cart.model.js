const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema cho từng sản phẩm trong giỏ hàng
const CartItemSchema = new Schema({
  foodId: {
    type: Schema.Types.ObjectId,
    ref: "Food", // Reference đến model Food
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1, // Số lượng tối thiểu là 1
  },
  price: {
    type: Number,
    required: true, // Giá tại thời điểm thêm vào giỏ
  },
});

// Schema chính cho Cart (dành cho máy POS)
const CartSchema = new Schema(
  {
    items: [CartItemSchema], // Danh sách các sản phẩm trong giỏ
    totalPrice: {
      type: Number,
      required: true,
      default: 0, // Tổng giá trị giỏ hàng
    },
    status: {
      type: String,
      enum: ["active", "completed", "canceled"], // Trạng thái của giỏ hàng
      default: "active",
    },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

module.exports = mongoose.model("Cart", CartSchema);
