const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["cash", "qr_code"], required: true },
    status: { type: String, enum: ["paid", "unpaid", "refunded", "cancelled"], default: "unpaid" },
    paid_at: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
