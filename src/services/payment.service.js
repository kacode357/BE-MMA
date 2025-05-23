const PaymentModel = require("../models/payment.model");
const PurchaseModel = require("../models/purchase.model");
const UserModel = require("../models/user.model");
const PackageModel = require("../models/package.model");

const PaymentService = {
  createPaymentService: (paymentData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, purchase_id, amount, payment_method } = paymentData;

        // Validate required fields
        if (!user_id || !purchase_id || !amount || !payment_method) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id, purchase_id, amount và payment_method là bắt buộc",
          });
        }

        // Kiểm tra payment_method
        if (payment_method !== "qr_code") {
          return reject({
            status: 400,
            ok: false,
            message: "Phương thức thanh toán phải là 'qr_code'",
          });
        }

        // Kiểm tra user tồn tại
        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        // Kiểm tra purchase tồn tại và hợp lệ
        const purchase = await PurchaseModel.findById(purchase_id);
        if (!purchase) {
          return reject({
            status: 404,
            ok: false,
            message: "Giao dịch mua không tồn tại",
          });
        }
        if (purchase.user_id.toString() !== user_id) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không phải người tạo giao dịch mua",
          });
        }
        if (purchase.status !== "pending") {
          return reject({
            status: 400,
            ok: false,
            message: "Giao dịch mua không ở trạng thái chờ thanh toán",
          });
        }

        // Kiểm tra package và amount
        const package = await PackageModel.findById(purchase.package_id);
        if (!package) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }
        if (package.price !== amount) {
          return reject({
            status: 400,
            ok: false,
            message: "Số tiền không khớp với giá gói",
          });
        }

        // Tạo bản ghi thanh toán
        const payment = await PaymentModel.create({
          purchase_id,
          amount,
          payment_method,
          payment_status: "pending",
          referenceCode: `PAY${Date.now()}`,
        });

        // Tạo URL QR Code động
        const qrCodeUrl = PaymentService.generateSepayQRCodeUrl(payment, package.price);

        resolve({
          status: 201,
          ok: true,
          message: "Tạo thanh toán thành công, vui lòng quét mã QR để thanh toán",
          data: {
            payment_id: payment._id,
            purchase_id: payment.purchase_id,
            payment_status: payment.payment_status,
            qr_code_url: qrCodeUrl,
            reference_code: payment.referenceCode,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tạo thanh toán: " + error.message,
        });
      }
    }),

  checkPaymentService: (checkData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, payment_id, reference_code } = checkData;

        // Validate required fields
        if (!user_id || (!payment_id && !reference_code)) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id và (payment_id hoặc reference_code) là bắt buộc",
          });
        }

        // Kiểm tra user tồn tại
        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        // Tìm payment dựa trên payment_id hoặc reference_code
        const query = payment_id ? { _id: payment_id } : { referenceCode: reference_code };
        const payment = await PaymentModel.findOne(query).populate('purchase_id');
        if (!payment) {
          return reject({
            status: 404,
            ok: false,
            message: "Thanh toán không tồn tại",
          });
        }

        // Kiểm tra quyền truy cập
        if (payment.purchase_id.user_id.toString() !== user_id) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không có quyền xem thanh toán này",
          });
        }

        // Lấy thông tin package
        const package = await PackageModel.findById(payment.purchase_id.package_id);
        if (!package) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }

        resolve({
          status: 200,
          ok: true,
          message: "Kiểm tra thanh toán thành công",
          data: {
            payment_id: payment._id,
            purchase_id: payment.purchase_id._id,
            amount: payment.amount,
            payment_method: payment.payment_method,
            payment_status: payment.payment_status,
            reference_code: payment.referenceCode,
            qr_code_url: payment.payment_status === 'pending' ? PaymentService.generateSepayQRCodeUrl(payment, payment.amount) : null,
            package_name: package.package_name,
            purchase_status: payment.purchase_id.status,
            created_at: payment.createdAt,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi kiểm tra thanh toán: " + error.message,
        });
      }
    }),

  generateSepayQRCodeUrl: (payment, amount) => {
    try {
      const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER || "16697391";
      const bankName = process.env.SEPAY_BANK_NAME || "ACB";
      const description = encodeURIComponent(`Thanh toán ${payment.referenceCode}`);

      const qrCodeUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankName}&amount=${amount}&des=${description}`;

      console.log('Generated SePay QR Code URL:', qrCodeUrl);

      return qrCodeUrl;
    } catch (error) {
      console.error('Generate SePay QR Code URL error:', error.message);
      throw new Error('Lỗi khi tạo URL QR: ' + error.message);
    }
  },

  processSepayWebhook: (data) =>
    new Promise(async (resolve, reject) => {
      try {
        const { id, gateway, transactionDate, transferAmount, referenceCode, transferType, content } = data;

        if (transferType !== 'in') {
          return resolve({
            status: 200,
            ok: true,
            message: 'Không xử lý giao dịch tiền ra',
          });
        }

        const existingPayment = await PaymentModel.findOne({
          sepayTransactionId: id,
        });
        if (existingPayment) {
          return resolve({
            status: 200,
            ok: true,
            message: 'Giao dịch đã được xử lý trước đó',
          });
        }

        const contentMatch = content.match(/PAY\d+/);
        const extractedReferenceCode = contentMatch ? contentMatch[0] : referenceCode;

        console.log('Extracted referenceCode from content:', extractedReferenceCode);

        const payment = await PaymentModel.findOne({ referenceCode: extractedReferenceCode });
        if (!payment) {
          return reject({
            status: 404,
            ok: false,
            message: 'Thanh toán không tồn tại với referenceCode: ' + extractedReferenceCode,
          });
        }

        if (transferAmount !== payment.amount) {
          payment.payment_status = 'failed';
          await payment.save();

          const purchase = await PurchaseModel.findById(payment.purchase_id);
          if (purchase) {
            purchase.status = 'failed';
            await purchase.save();
          }

          return reject({
            status: 400,
            ok: false,
            message: 'Số tiền không khớp với thanh toán',
          });
        }

        payment.payment_status = 'success';
        payment.sepayTransactionId = id;
        await payment.save();

        const purchase = await PurchaseModel.findById(payment.purchase_id);
        if (!purchase) {
          return reject({
            status: 404,
            ok: false,
            message: 'Giao dịch mua không tồn tại',
          });
        }

        purchase.status = 'completed';
        await purchase.save();

        const package = await PackageModel.findById(purchase.package_id);
        if (package && package.package_name.toLowerCase() === 'premium') {
          const user = await UserModel.findById(purchase.user_id);
          if (user) {
            user.role = 'premium';
            await user.save();
          }
        }

        resolve({
          status: 200,
          ok: true,
          message: 'Thanh toán đã được xác nhận thành công',
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: 'Lỗi khi xử lý Webhook: ' + error.message,
        });
      }
    }),
};

module.exports = PaymentService;