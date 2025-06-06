// src/models/chatHistory.model.js
const mongoose = require("mongoose");

const ChatHistorySchema = new mongoose.Schema({
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  package_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
    required: true,
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  message_type: {
    type: String,
    enum: ["text", "image", "file", "audio","image_to_image"],
    default: "text",
  },
  ai_source: {
    type: String,
    enum: ["gemini", "thehive", null],
    default: null,
  },
  prompt: {
    type: String,
    required: true,
  },
  input_image: { type: String }, 
  response: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

ChatHistorySchema.index({ session_id: 1, user_id: 1, created_at: -1 });

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);