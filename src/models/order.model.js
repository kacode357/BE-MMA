const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // Giá của món tại thời điểm mua
      },
    ],
    total_price: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    is_paid: { type: Boolean, default: false },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Nhân viên tạo đơn
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
