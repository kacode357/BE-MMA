const mongoose = require("mongoose");

const personalTodoSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: Date,
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("personalTodo", personalTodoSchema);
