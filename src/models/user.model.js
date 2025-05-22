const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  role: { type: String, default: "user" },
  is_active: { type: Boolean, default: true },
  avatar_url: { type: String, required: false, default: "", trim: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);