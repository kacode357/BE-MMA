const express = require("express");
const ChatSessionController = require("../controllers/chatSession.controller");
const auth = require("../middleware/auth");
const router = express.Router();

// Create a new chat session
router.post("/chat-sessions", auth, ChatSessionController.createChatSessionController);

// Send a message (text or image) in a chat session
router.post("/chat-sessions/:sessionId/message", auth, ChatSessionController.sendMessageController);

module.exports = router;