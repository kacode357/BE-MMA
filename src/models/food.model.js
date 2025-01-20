const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Tên món ăn
    category: { 
      type: mongoose.Schema.Types.ObjectId, // Tham chiếu đến Category
      ref: "Category",
      required: true 
    },
    price: { type: Number, required: true }, // Giá món ăn
    description: { type: String }, // Mô tả món ăn
    image_url: { type: String }, // Đường dẫn ảnh món ăn
    is_deleted: { type: Boolean, default: false } // Trạng thái xóa
  },
  { timestamps: true }
);

module.exports = mongoose.model("Food", foodSchema);
