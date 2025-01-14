const mongoose = require("mongoose");

const groupTodoSchema = mongoose.Schema(
  {
    groupName: { type: String, required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["view", "edit"], default: "view" },
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("groupTodo", groupTodoSchema);
