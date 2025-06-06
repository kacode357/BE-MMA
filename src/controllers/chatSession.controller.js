const ChatSessionService = require("../services/chatSession.service");

module.exports = {
  createChatSessionController: (req, res) =>
    new Promise(async (resolve, reject) => {
      // Giữ nguyên code hiện tại
      try {
        console.log('Creating chat session with body:', req.body);
        const { user_id, package_id, group_id, title } = req.body;

        const result = await ChatSessionService.createChatSessionService({
          user_id: user_id || req.user._id,
          package_id,
          group_id,
          title,
        });

        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error('Error in createChatSessionController:', error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi tạo phiên chat",
        });
      }
    }),

  sendMessageController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { sessionId } = req.params;
        const { prompt, message_type, ai_source, input_image } = req.body;

        const result = await ChatSessionService.sendMessageService({
          session_id: sessionId,
          user_id: req.user._id,
          prompt,
          message_type: message_type || 'text',
          ai_source,
          input_image, // Thêm input_image vào tham số
        });
        console.log('Send message result:', result);
        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error('Error in sendMessageController:', error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi gửi tin nhắn",
        });
      }
    }),
};