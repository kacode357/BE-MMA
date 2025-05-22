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
        });

        // Tạo URL QR Code động theo tài liệu SePay
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

  // Tạo URL QR Code động theo tài liệu SePay
  generateSepayQRCodeUrl: (payment, amount) => {
    try {
      const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER || "16697391"; // Số tài khoản ngân hàng
      const bankName = process.env.SEPAY_BANK_NAME || "Ngân hàng TMCP Á Châu"; // Tên ngân hàng
      const description = encodeURIComponent(`Thanh toán đơn hàng #${payment.purchase_id}`);

      // Tạo URL QR theo cấu trúc của SePay
      const qrCodeUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankName}&amount=${amount}&des=${description}`;

      console.log('Generated SePay QR Code URL:', qrCodeUrl);

      return qrCodeUrl;
    } catch (error) {
      console.error('Generate SePay QR Code URL error:', error.message);
      throw new Error('Lỗi khi tạo URL QR: ' + error.message);
    }
  },

  // Xử lý Webhook từ SePay
  processSepayWebhook: (data) =>
    new Promise(async (resolve, reject) => {
      try {
        const { gateway, transactionDate, transferAmount, referenceCode, transferType } = data;

        // Chỉ xử lý giao dịch "in" (tiền vào)
        if (transferType !== 'in') {
          return resolve({
            status: 200,
            ok: true,
            message: 'Không xử lý giao dịch tiền ra',
          });
        }

        // Tìm bản ghi thanh toán dựa trên referenceCode (payment_id)
        const payment = await PaymentModel.findById(referenceCode);
        if (!payment) {
          return reject({
            status: 404,
            ok: false,
            message: 'Thanh toán không tồn tại',
          });
        }

        // Kiểm tra số tiền
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

        // Cập nhật trạng thái thanh toán và đơn hàng
        payment.payment_status = 'success';
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

        // Cập nhật role = premium nếu là gói Premium
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