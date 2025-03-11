const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id : { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String },
    phone_number: { type: String },
    status: { type: String },
    is_deleted: { type: Boolean },
  },
  { timestamps: true }
); // Thêm timestamps vào schema

module.exports = mongoose.model("User", userSchema);
