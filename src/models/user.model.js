const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    fullname: { type: String, default: null },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    image: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    locations: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now }, // Thời gian ghi nhận vị tr
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
