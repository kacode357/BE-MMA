const axios = require("axios");
const { GoogleGenAI, Modality } = require("@google/genai"); // Add Modality import
const ChatSessionModel = require("../models/chatSession.model");
const ChatHistoryModel = require("../models/chatHistory.model");
const UserModel = require("../models/user.model");
const PackageModel = require("../models/package.model");
const GroupMemberModel = require("../models/groupMember.model");
const { checkPackageAccessService } = require("./package.service");
const isBase64 = require("is-base64");
require("dotenv").config();

class ChatSessionService {
  constructor() {
    this.logger = {
      info: (message, meta) => console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta || ''),
      error: (message, meta) => console.error(`[ERROR] ${new Date().toISOString()} ${message}`, meta || ''),
    };
    this.genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
  }

  async createChatSessionService({ user_id, package_id, group_id, title }) {
    try {
      this.logger.info('Creating chat session', { user_id, package_id, group_id, title });

      if (!user_id || !package_id) {
        throw new Error("user_id và package_id là bắt buộc");
      }

      const user = await UserModel.findById(user_id);
      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      const packageData = await PackageModel.findById(package_id);
      if (!packageData || packageData.is_delete) {
        throw new Error("Gói không tồn tại hoặc đã bị xóa");
      }

      const accessResult = await checkPackageAccessService({ user_id, package_id });
      this.logger.info('Package access check', { accessResult });
      if (accessResult.status !== 200) {
        throw new Error(accessResult.message);
      }

      if (group_id) {
        const groupMember = await GroupMemberModel.findOne({ group_id, user_id });
        if (!groupMember) {
          throw new Error("Bạn không phải là thành viên của nhóm này");
        }
      }

      const chatSession = await ChatSessionModel.create({
        user_id,
        package_id,
        group_id,
        title,
        started_at: new Date(),
      });

      const response = {
        status: 201,
        ok: true,
        message: "Tạo phiên chat thành công",
        data: {
          session_id: chatSession._id,
          user_id: chatSession.user_id,
          package_id: chatSession.package_id,
          group_id: chatSession.group_id,
          title: chatSession.title,
          started_at: chatSession.started_at,
        },
      };

      this.logger.info('Chat session created', { session_id: chatSession._id });
      return response;
    } catch (error) {
      this.logger.error('Error in createChatSessionService', { error: error.message, stack: error.stack });
      return {
        status: 500,
        ok: false,
        message: `Lỗi khi tạo phiên chat: ${error.message}`,
      };
    }
  }

  async sendMessageService({ session_id, user_id, prompt, message_type, ai_source, input_image }) {
    try {
      this.logger.info('Sending message', { session_id, user_id, message_type, ai_source });

      if (!session_id || !user_id || !prompt || !message_type) {
        throw new Error("session_id, user_id, prompt và message_type là bắt buộc");
      }

      const validMessageTypes = ['text', 'image', 'image_to_image'];
      if (!validMessageTypes.includes(message_type)) {
        throw new Error("message_type phải là 'text', 'image' hoặc 'image_to_image'");
      }

      const validAiSources = ['gemini', 'thehive'];
      if ((message_type === 'image' || message_type === 'image_to_image') && !validAiSources.includes(ai_source)) {
        throw new Error("ai_source phải là 'gemini' hoặc 'thehive' khi message_type là 'image' hoặc 'image_to_image'");
      }

      const chatSession = await ChatSessionModel.findById(session_id);
      if (!chatSession) {
        throw new Error("Phiên chat không tồn tại");
      }

      if (chatSession.user_id.toString() !== user_id) {
        throw new Error("Bạn không có quyền gửi tin nhắn trong phiên chat này");
      }

      const accessResult = await checkPackageAccessService({
        user_id,
        package_id: chatSession.package_id,
      });
      this.logger.info('Package access check for message', { accessResult });
      if (accessResult.status !== 200) {
        throw new Error(accessResult.message);
      }

      if (chatSession.group_id) {
        const groupMember = await GroupMemberModel.findOne({
          group_id: chatSession.group_id,
          user_id,
        });
        if (!groupMember) {
          throw new Error("Bạn không phải là thành viên của nhóm này");
        }
      }

      let responseData;
      let chatHistory;

      if (message_type === 'text') {
        const requestPayload = {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        };
        this.logger.info('Sending text request to Gemini', { requestPayload });

        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        this.logger.info('Gemini text response', { response: geminiResponse.data });
        responseData = geminiResponse.data.candidates[0].content.parts[0].text;

        chatHistory = await ChatHistoryModel.create({
          session_id,
          user_id,
          package_id: chatSession.package_id,
          group_id: chatSession.group_id,
          message_type: 'text',
          ai_source: 'gemini',
          prompt,
          response: responseData,
          created_at: new Date(),
        });
      } else if (message_type === 'image') {
        if (ai_source === 'thehive') {
          const requestPayload = {
            input: {
              prompt,
              negative_prompt: 'blurry',
              image_size: { width: 1024, height: 1024 },
              num_inference_steps: 15,
              guidance_scale: 3.5,
              num_images: 2,
              seed: 67,
              output_format: 'jpeg',
              output_quality: 90,
            },
          };
          this.logger.info('Sending image request to TheHive', { requestPayload });

          const stabilityResponse = await axios.post(
            'https://api.thehive.ai/api/v3/stabilityai/sdxl',
            requestPayload,
            {
              headers: {
                'Authorization': `Bearer ${process.env.STABILITY_AI_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );

          this.logger.info('TheHive AI response', { response: stabilityResponse.data });

          if (!stabilityResponse.data.output || !Array.isArray(stabilityResponse.data.output)) {
            throw new Error('Phản hồi từ TheHive AI không đúng định dạng: thiếu output hoặc không phải mảng');
          }

          responseData = JSON.stringify(
            stabilityResponse.data.output.map(img => img.url)
          );

          chatHistory = await ChatHistoryModel.create({
            session_id,
            user_id,
            package_id: chatSession.package_id,
            group_id: chatSession.group_id,
            message_type: 'image',
            ai_source: 'thehive',
            prompt,
            response: responseData,
            created_at: new Date(),
          });
        } else if (ai_source === 'gemini') {
          const requestConfig = {
            model: "gemini-2.0-flash-preview-image-generation",
            contents: `Create a high-quality image of: ${prompt}`,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          };
          this.logger.info('Sending image request to Gemini via SDK', { requestConfig });

          try {
            const response = await this.genAI.models.generateContent(requestConfig);

            this.logger.info('Gemini image response', { response });

            if (!response.candidates || !response.candidates[0].content.parts) {
              throw new Error('Phản hồi từ Gemini Image API không đúng định dạng: thiếu candidates hoặc parts');
            }

            const imageDataArray = response.candidates[0].content.parts
              .filter(part => part.inlineData && part.inlineData.data)
              .map(part => ({
                mimeType: part.inlineData.mime_type || 'image/jpeg',
                data: part.inlineData.data,
              }));

            const textDataArray = response.candidates[0].content.parts
              .filter(part => part.text)
              .map(part => part.text);

            if (!imageDataArray.length && !textDataArray.length) {
              throw new Error('Phản hồi từ Gemini Image API không chứa dữ liệu ảnh hoặc văn bản');
            }

            responseData = JSON.stringify({
              images: imageDataArray,
              text: textDataArray.join(' ') || '',
            });

            chatHistory = await ChatHistoryModel.create({
              session_id,
              user_id,
              package_id: chatSession.package_id,
              group_id: chatSession.group_id,
              message_type: 'image',
              ai_source: 'gemini',
              prompt,
              response: responseData,
              created_at: new Date(),
            });
          } catch (apiError) {
            this.logger.error('Gemini Image API Error', {
              error: apiError.message,
              response: apiError.response,
              stack: apiError.stack,
            });
            throw new Error(`Lỗi khi gọi Gemini Image API: ${apiError.message}`);
          }
        }
      } else if (message_type === 'image_to_image') {
        if (ai_source !== 'gemini') {
          throw new Error("image_to_image chỉ hỗ trợ ai_source là 'gemini'");
        }

        if (!input_image) {
          throw new Error("input_image là bắt buộc cho message_type 'image_to_image'");
        }

        const { mimeType, data } = input_image;
        if (!mimeType || !data) {
          throw new Error("input_image phải chứa mimeType và data");
        }

        const validMimeTypes = ['image/jpeg', 'image/png'];
        if (!validMimeTypes.includes(mimeType)) {
          throw new Error("input_image phải có mimeType là 'image/jpeg' hoặc 'image/png'");
        }

        // Validate base64 data
        if (!isBase64(data, { mimeRequired: false })) {
          this.logger.error('Invalid base64 data', { dataLength: data.length });
          throw new Error("input_image.data không phải là chuỗi base64 hợp lệ");
        }

        // Verify base64 can be decoded
        try {
          const buffer = Buffer.from(data, 'base64');
          if (buffer.length === 0) {
            throw new Error("Dữ liệu base64 rỗng sau khi giải mã");
          }
          this.logger.info('Base64 data validated', { bufferLength: buffer.length });
        } catch (decodeError) {
          this.logger.error('Base64 decode error', { error: decodeError.message });
          throw new Error("Không thể giải mã chuỗi base64: " + decodeError.message);
        }

        // Prepare request config based on provided script
        const requestConfig = {
          model: "gemini-2.0-flash-preview-image-generation",
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: data,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        };

        this.logger.info('Sending image-to-image request to Gemini via SDK', {
          requestConfig: {
            ...requestConfig,
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: data.substring(0, 50) + '...' // Log first 50 chars
                    },
                  },
                ],
              },
            ],
          },
        });

        try {
          const response = await this.genAI.models.generateContent(requestConfig);
          this.logger.info('Gemini image-to-image response', { response });

          if (!response.candidates || !response.candidates[0].content.parts) {
            throw new Error('Phản hồi từ Gemini Image-to-Image API không đúng định dạng: thiếu candidates hoặc parts');
          }

          // Process response parts as in the provided script
          const imageDataArray = [];
          const textDataArray = [];

          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              textDataArray.push(part.text);
            } else if (part.inlineData && part.inlineData.data) {
              imageDataArray.push({
                mimeType: part.inlineData.mime_type || 'image/jpeg',
                data: part.inlineData.data,
              });
            }
          }

          if (!imageDataArray.length && !textDataArray.length) {
            throw new Error('Phản hồi từ Gemini Image-to-Image API không chứa dữ liệu ảnh hoặc văn bản');
          }

          responseData = JSON.stringify({
            images: imageDataArray,
            text: textDataArray.join(' ') || '',
          });

          chatHistory = await ChatHistoryModel.create({
            session_id,
            user_id,
            package_id: chatSession.package_id,
            group_id: chatSession.group_id,
            message_type: 'image_to_image',
            ai_source: 'gemini',
            prompt,
            input_image: JSON.stringify({ mimeType, data }),
            response: responseData,
            created_at: new Date(),
          });
        } catch (apiError) {
          this.logger.error('Gemini Image-to-Image API Error', {
            error: apiError.message,
            response: apiError.response ? apiError.response.data : null,
            stack: apiError.stack,
          });
          let errorMessage = `Lỗi khi gọi Gemini Image-to-Image API: ${apiError.message}`;
          if (apiError.response && apiError.response.status === 400) {
            errorMessage = `Dữ liệu không hợp lệ: ${apiError.response.data.error.message || apiError.message}`;
          }
          throw new Error(errorMessage);
        }
      }

      const response = {
        status: 200,
        ok: true,
        message: "Gửi tin nhắn thành công",
        data: {
          history_id: chatHistory._id,
          session_id: chatHistory.session_id,
          user_id: chatHistory.user_id,
          package_id: chatHistory.package_id,
          group_id: chatHistory.group_id,
          message_type: chatHistory.message_type,
          ai_source: chatHistory.ai_source,
          prompt: chatHistory.prompt,
          input_image: chatHistory.input_image || null,
          response: chatHistory.response,
          created_at: chatHistory.created_at,
        },
      };

      this.logger.info('Message sent successfully', { history_id: chatHistory._id });
      return response;
    } catch (error) {
      this.logger.error('Error in sendMessageService', { error: error.message, stack: error.stack });
      return {
        status: 500,
        ok: false,
        message: `Lỗi khi gửi tin nhắn: ${error.message}`,
      };
    }
  }
}

module.exports = new ChatSessionService();