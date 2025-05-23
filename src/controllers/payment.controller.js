const PaymentService = require("../services/payment.service");

module.exports = {
  createPaymentController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, purchase_id, amount, payment_method } = req.body;

        const result = await PaymentService.createPaymentService({
          user_id,
          purchase_id,
          amount,
          payment_method,
        });

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi tạo thanh toán",
        });
      }
    }),

  checkPaymentController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, payment_id, reference_code } = req.body;

        const result = await PaymentService.checkPaymentService({
          user_id,
          payment_id,
          reference_code,
        });

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi kiểm tra thanh toán",
        });
      }
    }),

  handleSepayWebhook: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const forwardedIps = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const clientIp = forwardedIps ? forwardedIps.split(',')[0].trim() : req.connection.remoteAddress;

        console.log('Webhook client IP:', clientIp);

        if (clientIp !== '103.255.238.9') {
          return res.status(403).json({
            success: false,
            message: 'IP không được phép: ' + clientIp,
          });
        }

        const authHeader = req.headers['authorization'];
        const expectedApiKey = process.env.SEPAY_API_KEY;
        if (!authHeader || authHeader !== `Apikey ${expectedApiKey}`) {
          return res.status(401).json({
            success: false,
            message: 'Chứng thực API Key thất bại',
          });
        }

        const data = req.body;
        console.log('Webhook data:', data);

        if (!data || !data.id || !data.transactionDate || !data.transferAmount || !data.referenceCode) {
          return res.status(400).json({
            success: false,
            message: 'Dữ liệu Webhook không hợp lệ',
          });
        }

        const result = await PaymentService.processSepayWebhook(data);

        return res.status(200).json({
          success: true,
          message: 'Webhook xử lý thành công',
        });
      } catch (error) {
        console.error('Webhook error:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Lỗi server khi xử lý Webhook: ' + error.message,
        });
      }
    }),
};