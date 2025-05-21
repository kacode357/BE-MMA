const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  purchase_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchase",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  payment_method: {
    type: String,
    required: true,
    enum: ["credit_card", "paypal", "bank_transfer"],
  },
  payment_status: {
    type: String,
    required: true,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  payment_date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);