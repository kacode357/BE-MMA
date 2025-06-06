const express = require("express");
const ChatHistoryController = require("../controllers/chatHistory.controller");
const auth = require("../middleware/auth");
const router = express.Router();

// Lấy danh sách lịch sử tin nhắn theo session_id
router.get("/chat-history/session/:sessionId", auth, ChatHistoryController.getChatHistoryBySessionController);

// Lấy chi tiết một bản ghi lịch sử theo ID
router.get("/chat-history/:id", auth, ChatHistoryController.getChatHistoryByIdController);

module.exports = router;