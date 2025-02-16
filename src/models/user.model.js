const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
 
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
  

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
