const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image_url: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Food", foodSchema);
