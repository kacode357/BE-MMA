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

      // So sánh chữ ký
      if (secureHash === signed) {
        const { vnp_TxnRef: paymentId, vnp_ResponseCode, vnp_Amount } = vnp_Params;

        // Tìm payment trong database
        const payment = await Payment.findById(paymentId);
        if (!payment) {
          return res.status(404).json({ RspCode: "01", Message: "Payment not found" });
        }

        // Cập nhật trạng thái thanh toán
        if (vnp_ResponseCode === "00") {
          payment.status = "success";

          // Cập nhật trạng thái của cart (nếu cần)
          const cart = await Cart.findById(payment.cartId);
          if (cart) {
            cart.status = "success";
            await cart.save();
          }
        } else {
          payment.status = "failed";
        }

        payment.amountPaid = parseInt(vnp_Amount) / 100; 
        await payment.save();

        // Trả kết quả thành công
        return res.status(200).json({ RspCode: "00", Message: "success" });
      } else {
        // Trả kết quả lỗi checksum
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
