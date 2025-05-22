const PaymentModel = require("../models/payment.model");
const PurchaseModel = require("../models/purchase.model");
const UserModel = require("../models/user.model");
const PackageModel = require("../models/package.model");

module.exports = {
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

        // Tạo mã QR thanh toán với SePay
        const qrCodeUrl = await createSepayQRCode(payment, package.price);

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

  // Tạo mã QR thanh toán với SePay
  createSepayQRCode: async (payment, amount) => {
    try {
      const response = await axios.post(
        'https://my.sepay.vn/api/v1/qr/create',
        {
          amount: amount,
          description: `Thanh toán đơn hàng #${payment.purchase_id}`,
          reference_code: payment._id.toString(), // Mã tham chiếu để đối chiếu giao dịch
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer fOseMdBQoHrcwUd`,
          },
        }
      );

      console.log('SePay QR Code response:', response.data);

      if (response.status === 200 && response.data.qr_code_url) {
        return response.data.qr_code_url;
      } else {
        throw new Error('Không thể tạo mã QR từ SePay.');
      }
    } catch (error) {
      console.error('SePay QR Code error:', error.message);
      throw new Error('Lỗi khi tạo mã QR: ' + error.message);
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