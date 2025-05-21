const mongoose = require("mongoose");

const groupMemberSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  added_at: { type: Date, default: Date.now },
});

groupMemberSchema.index({ group_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("GroupMember", groupMemberSchema);