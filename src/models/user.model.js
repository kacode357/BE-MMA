const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    is_active: { type: Boolean, default: true },
    latitude: { type: Number, required: false },  // Latitude field
    longitude: { type: Number, required: false }, // Longitude field
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
