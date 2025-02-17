const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");

module.exports = {
  createUserService: (userData) =>
    new Promise(async (resolve, reject) => {
      try {
        const newUser = await UserModel.create(userData); // Bao gồm role và is_active
        resolve({
          status: 201,
          ok: true,
          message: "Tạo người dùng thành công",
          user: newUser,
        });
      } catch (error) {
        reject({
          status: error.code === 11000 ? 400 : 500,
          ok: false,
          message: error.message || "Tạo người dùng thất bại",
        });
      }
    }),

  // Service - loginUserService
loginUserService: ({ username, password, latitude, longitude }) =>
  new Promise(async (resolve, reject) => {
    try {
      // Tìm người dùng theo username
      const user = await UserModel.findOne({ username });

      if (!user) {
        return reject({
          status: 404,
          ok: false,
          message: "Tên người dùng không tồn tại",
        });
      }

      // So sánh mật khẩu trực tiếp
      if (user.password !== password) {
        return reject({
          status: 401,
          ok: false,
          message: "Mật khẩu không đúng",
        });
      }

      // Cập nhật latitude và longitude nếu có
      if (latitude && longitude) {
        user.latitude = latitude;
        user.longitude = longitude;
        await user.save(); // Lưu thông tin mới
      }

      // Tạo access token và refresh token sau khi đăng nhập thành công
      const accessToken = jwt.sign(
        { user_id: user._id },  // Payload của token
        process.env.JWT_SECRET_KEY, // Mã bí mật để mã hóa token
        { expiresIn: "1h" } // Token hết hạn sau 1 giờ
      );

      // Tạo refresh token
      const refreshToken = jwt.sign(
        { user_id: user._id },  // Payload của refresh token
        process.env.JWT_REFRESH_SECRET_KEY, // Mã bí mật để mã hóa refresh token
        { expiresIn: "7d" } // Refresh token hết hạn sau 7 ngày
      );

      // Đăng nhập thành công, trả về access token và refresh token
      resolve({
        status: 200,
        message: "Đăng nhập thành công",
        data: {
          user_id: user._id,
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      reject({
        status: 500,
        ok: false,
        message: error.message || "Lỗi server khi đăng nhập",
      });
    }
  }),
    refreshTokenService: async (accessToken, refreshToken) => {
      try {
        // Verify refresh token
        const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
  
        // Verify access token
        const decodedAccess = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
  
        // Check if the user associated with both tokens is the same
        if (decodedRefresh.user_id !== decodedAccess.user_id) {
          throw new Error("Tokens are for different users");
        }
  
        // Find the user based on the user_id from the access token
        const user = await UserModel.findById(decodedAccess.user_id);
        if (!user) {
          throw new Error("User not found");
        }
  
        // Return the same tokens if everything is valid
        return { accessToken, refreshToken }; // Return both tokens as they are
      } catch (error) {
        throw new Error(error.message || "Error validating tokens");
      }
    },
};
