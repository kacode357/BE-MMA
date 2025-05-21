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

        // Giả lập thanh toán
        const paymentSuccess = true; // Thay bằng logic gọi cổng thanh toán
        if (paymentSuccess) {
          payment.payment_status = "success";
          purchase.status = "completed";

          // Cập nhật role = premium nếu là gói Premium
          if (package.package_name.toLowerCase() === "premium") {
            user.role = "premium";
            await user.save();
          }
        } else {
          payment.payment_status = "failed";
          purchase.status = "failed";
        }
        await payment.save();
        await purchase.save();

        resolve({
          status: 201,
          ok: true,
          message: "Tạo thanh toán thành công",
          data: {
            payment_id: payment._id,
            purchase_id: payment.purchase_id,
            payment_status: payment.payment_status,
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
};