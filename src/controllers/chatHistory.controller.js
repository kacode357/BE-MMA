const ChatHistoryService = require("../services/chatHistory.service");

module.exports = {
  getChatHistoryBySessionController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { sessionId } = req.params;
        const { keyword = "", pageNum = 1, pageSize = 10 } = req.query;
        const searchCondition = { keyword };
        const pageInfo = {
          pageNum: parseInt(pageNum) || 1,
          pageSize: parseInt(pageSize) || 10,
        };

        const result = await ChatHistoryService.getChatHistoryBySessionService(
          sessionId,
          req.user,
          searchCondition,
          pageInfo
        );

        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error("Error in getChatHistoryBySessionController:", error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi lấy danh sách lịch sử chat",
        });
      }
    }),

  getChatHistoryByIdController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { id } = req.params;

        const result = await ChatHistoryService.getChatHistoryByIdService(id, req.user);

        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error("Error in getChatHistoryByIdController:", error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi lấy chi tiết lịch sử chat",
        });
      }
    }),
};