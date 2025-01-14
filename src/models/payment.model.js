const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema cho Payment (Thanh toán)
const PaymentSchema = new Schema(
  {
    cartId: {
      type: Schema.Types.ObjectId,
      ref: "Cart", // Reference đến model Cart
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true, // Số tiền khách hàng thanh toán
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit_card", "debit_card", "other"], // Các phương thức thanh toán
      default: "cash",
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed"], // Trạng thái thanh toán
      default: "pending",
    },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

module.exports = mongoose.model("Payment", PaymentSchema);
