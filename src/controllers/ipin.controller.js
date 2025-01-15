const Payment = require("../models/payment.model");
const Cart = require("../models/cart.model");
const config = require("../config/default.json");
const querystring = require("qs");
const crypto = require("crypto");

const IPNController = {
  async handleIPN(req, res) {
    try {
      let vnp_Params = req.query;
      const secureHash = vnp_Params["vnp_SecureHash"];

      // Xóa các trường không cần thiết trước khi ký
      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      // Sắp xếp các tham số theo thứ tự chữ cái
      vnp_Params = sortObject(vnp_Params);

      // Lấy secretKey từ cấu hình
      const secretKey = config.vnp_HashSecret;

      // Tạo chuỗi ký
      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // Kiểm tra chữ ký
      if (secureHash === signed) {
        const { vnp_OrderInfo: paymentId, vnp_ResponseCode, vnp_Amount } = vnp_Params;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
          return res.status(400).json({ RspCode: "01", Message: "Payment not found" });
        }

        if (vnp_ResponseCode === "00") {
          payment.status = "successful";
          payment.amountPaid = parseInt(vnp_Amount) / 100;

          // Cập nhật trạng thái Cart nếu có cartId
          if (payment.cartId) {
            const cart = await Cart.findById(payment.cartId);
            if (cart) {
              cart.status = "completed";
              await cart.save();
            }
          }
        } else {
          payment.status = "failed";
        }

        await payment.save();

        // Trả kết quả thành công về VNPay
        return res.status(200).json({ RspCode: "00", Message: "Success" });
      } else {
        // Nếu chữ ký không khớp, trả về lỗi
        return res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
      }
    } catch (error) {
      console.error("Error handling IPN:", error.message);
      res.status(500).json({ RspCode: "99", Message: "Internal server error" });
    }
  },
};

// Hàm sắp xếp object theo thứ tự chữ cái
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
};

module.exports = IPNController;

