const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES; // 1d
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES;

module.exports = {
  createUserService: (userData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { username, password, full_name, email } = userData;

        // Validate required fields
        if (!username || !password || !full_name || !email) {
          return reject({
            status: 400,
            ok: false,
            message: "Tên người dùng, mật khẩu, họ tên và email là bắt buộc",
          });
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return reject({
            status: 400,
            ok: false,
            message: "Email không hợp lệ",
          });
        }

        // Kiểm tra trùng username
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
          return reject({
            status: 409,
            ok: false,
            message: "Tên người dùng đã tồn tại",
          });
        }

        // Kiểm tra trùng email
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
          return reject({
            status: 409,
            ok: false,
            message: "Email đã tồn tại",
          });
        }

        // Kiểm tra trùng full_name (tùy chọn, bỏ nếu không cần)
        const existingFullName = await UserModel.findOne({ full_name });
        if (existingFullName) {
          return reject({
            status: 409,
            ok: false,
            message: "Họ tên đã được sử dụng",
          });
        }

        // Mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        await UserModel.create({
          username,
          password: hashedPassword,
          full_name,
          email,
          // avatar_url không cần truyền vào, sẽ tự động rỗng (default: "")
        });

        resolve({
          status: 201,
          ok: true,
          message: "Tạo người dùng thành công",
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tạo người dùng: " + error.message,
        });
      }
    }),

  loginUserService: ({ username, password }) =>
    new Promise(async (resolve, reject) => {
      try {
        // Validate required fields
        if (!username || !password) {
          return reject({
            status: 400,
            ok: false,
            message: "Tên người dùng và mật khẩu là bắt buộc",
          });
        }

        const user = await UserModel.findOne({ username });

        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Tên người dùng không tồn tại",
          });
        }

        // So sánh hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return reject({
            status: 401,
            ok: false,
            message: "Mật khẩu không đúng",
          });
        }

        // Tạo access token
        const access_token = jwt.sign(
          { id: user._id, username: user.username, role: user.role, email: user.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES }
        );

        // Tạo refresh token
        const refresh_token = jwt.sign(
          { id: user._id, username: user.username },
          JWT_SECRET,
          { expiresIn: REFRESH_TOKEN_EXPIRES }
        );

        resolve({
          status: 200,
          ok: true,
          message: "Đăng nhập thành công",
          access_token,
          refresh_token,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi đăng nhập: " + error.message,
        });
      }
    }),

  resetTokenService: ({ access_token, refresh_token }) =>
    new Promise(async (resolve, reject) => {
      try {
        // Validate required fields
        if (!refresh_token) {
          return reject({
            status: 400,
            ok: false,
            message: "Refresh token là bắt buộc",
          });
        }

        // Xác minh refresh token
        let decoded;
        try {
          decoded = jwt.verify(refresh_token, JWT_SECRET);
        } catch (error) {
          return reject({
            status: 401,
            ok: false,
            message: "Refresh token không hợp lệ hoặc đã hết hạn",
          });
        }

        // Kiểm tra user tồn tại
        const user = await UserModel.findById(decoded.id);
        if (!user) {
          return reject({
            status: 401,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        // Tạo access token mới
        const new_access_token = jwt.sign(
          { id: user._id, username: user.username, role: user.role, email: user.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES }
        );

        // Tạo refresh token mới
        const new_refresh_token = jwt.sign(
          { id: user._id, username: user.username },
          JWT_SECRET,
          { expiresIn: REFRESH_TOKEN_EXPIRES }
        );

        resolve({
          status: 200,
          ok: true,
          message: "Làm mới token thành công",
          access_token: new_access_token,
          refresh_token: new_refresh_token,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi làm mới token: " + error.message,
        });
      }
    }),

  getCurrentLoginService: (user) =>
    new Promise(async (resolve, reject) => {
      try {
        // Lấy thông tin user từ req.user (được middleware auth thiết lập)
        const userData = await UserModel.findById(user._id).select("-password");
        if (!userData) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        resolve({
          status: 200,
          message: "Lấy thông tin người dùng thành công",
          data: {
            id: userData._id,
            username: userData.username,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            is_active: userData.is_active,
            created_at: userData.created_at,
            avatar_url: userData.avatar_url, // Thêm field avatar_url vào dữ liệu trả về
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy thông tin người dùng: " + error.message,
        });
      }
    }),
};