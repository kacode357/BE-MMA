const mongoose = require("mongoose");
const ChatSessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  title: { type: String },
  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date },
});
module.exports = mongoose.model("ChatSession", ChatSessionSchema);