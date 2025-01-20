const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, sparse: true }, // Thêm sparse
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    full_name: { type: String, required: true },
    phone: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
