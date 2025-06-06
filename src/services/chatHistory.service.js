const ChatHistoryModel = require("../models/chatHistory.model");
const ChatSessionModel = require("../models/chatSession.model");
const UserModel = require("../models/user.model");
const GroupMemberModel = require("../models/groupMember.model");
const { checkPackageAccessService } = require("./package.service");

module.exports = {
  getChatHistoryBySessionService: (sessionId, user, searchCondition = {}, pageInfo = {}) =>
    new Promise(async (resolve, reject) => {
      try {
        // Validate sessionId
        if (!sessionId) {
          return reject({
            status: 400,
            ok: false,
            message: "session_id là bắt buộc",
          });
        }

        // Check if session exists
        const chatSession = await ChatSessionModel.findById(sessionId);
        if (!chatSession) {
          return reject({
            status: 404,
            ok: false,
            message: "Phiên chat không tồn tại",
          });
        }

        // Check user permission (admin or session owner)
        if (user.role !== "admin" && chatSession.user_id.toString() !== user._id.toString()) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không có quyền xem lịch sử chat này",
          });
        }

        // Check package access
        const accessResult = await checkPackageAccessService({
          user_id: user._id,
          package_id: chatSession.package_id,
        });
        if (accessResult.status !== 200) {
          return reject({
            status: accessResult.status,
            ok: false,
            message: accessResult.message,
          });
        }

        // If group_id exists, verify group membership
        if (chatSession.group_id) {
          const groupMember = await GroupMemberModel.findOne({
            group_id: chatSession.group_id,
            user_id: user._id,
          });
          if (!groupMember) {
            return reject({
              status: 403,
              ok: false,
              message: "Bạn không phải là thành viên của nhóm này",
            });
          }
        }

        const { keyword = "" } = searchCondition;
        const { pageNum = 1, pageSize = 10 } = pageInfo;

        // Validate pagination
        if (!Number.isInteger(pageNum) || pageNum < 1) {
          return reject({
            status: 400,
            ok: false,
            message: "pageNum phải là số nguyên dương",
          });
        }
        if (!Number.isInteger(pageSize) || pageSize < 1) {
          return reject({
            status: 400,
            ok: false,
            message: "pageSize phải là số nguyên dương",
          });
        }

        // Build query
        const query = {
          session_id: sessionId,
          $or: [
            { prompt: { $regex: keyword, $options: "i" } },
            { response: { $regex: keyword, $options: "i" } },
          ],
        };

        // Pagination
        const skip = (pageNum - 1) * pageSize;
        const limit = pageSize;

        // Fetch chat history
        const chatHistory = await ChatHistoryModel.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .lean();

        // Count total items
        const total = await ChatHistoryModel.countDocuments(query);
        const totalPages = Math.ceil(total / pageSize);

        // Format response
        const pageData = chatHistory.map((history) => ({
          history_id: history._id,
          session_id: history.session_id,
          user_id: history.user_id,
          package_id: history.package_id,
          group_id: history.group_id,
          message_type: history.message_type,
          prompt: history.prompt,
          response: history.response,
          created_at: history.created_at,
        }));

        resolve({
          status: 200,
          ok: true,
          message: "Lấy danh sách lịch sử chat thành công",
          data: {
            pageData,
            pageInfo: {
              pageNum,
              pageSize,
              total,
              totalPages,
            },
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy danh sách lịch sử chat: " + error.message,
        });
      }
    }),

  getChatHistoryByIdService: (historyId, user) =>
    new Promise(async (resolve, reject) => {
      try {
        // Validate historyId
        if (!historyId) {
          return reject({
            status: 400,
            ok: false,
            message: "history_id là bắt buộc",
          });
        }

        // Fetch chat history
        const history = await ChatHistoryModel.findById(historyId).lean();
        if (!history) {
          return reject({
            status: 404,
            ok: false,
            message: "Bản ghi lịch sử chat không tồn tại",
          });
        }

        // Fetch session to check permissions
        const chatSession = await ChatSessionModel.findById(history.session_id);
        if (!chatSession) {
          return reject({
            status: 404,
            ok: false,
            message: "Phiên chat không tồn tại",
          });
        }

        // Check user permission (admin or session owner)
        if (user.role !== "admin" && chatSession.user_id.toString() !== user._id.toString()) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không có quyền xem bản ghi lịch sử chat này",
          });
        }

        // Check package access
        const accessResult = await checkPackageAccessService({
          user_id: user._id,
          package_id: history.package_id,
        });
        if (accessResult.status !== 200) {
          return reject({
            status: accessResult.status,
            ok: false,
            message: accessResult.message,
          });
        }

        // If group_id exists, verify group membership
        if (history.group_id) {
          const groupMember = await GroupMemberModel.findOne({
            group_id: history.group_id,
            user_id: user._id,
          });
          if (!groupMember) {
            return reject({
              status: 403,
              ok: false,
              message: "Bạn không phải là thành viên của nhóm này",
            });
          }
        }

        // Format response
        const historyData = {
          history_id: history._id,
          session_id: history.session_id,
          user_id: history.user_id,
          package_id: history.package_id,
          group_id: history.group_id,
          message_type: history.message_type,
          prompt: history.prompt,
          response: history.response,
          created_at: history.created_at,
        };

        resolve({
          status: 200,
          ok: true,
          message: "Lấy chi tiết lịch sử chat thành công",
          data: historyData,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy chi tiết lịch sử chat: " + error.message,
        });
      }
    }),
};