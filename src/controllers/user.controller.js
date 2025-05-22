const PackageService = require("../services/package.service");
const UserService = require("../services/user.service");

module.exports = {
  createUserController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { username, password, full_name, email } = req.body;

        const result = await UserService.createUserService({
          username,
          password,
          full_name,
          email,
        });

        return res.status(result.status).json({
          status: result.status,
          message: result.message || "Tạo người dùng thành công",
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({ ok: false, message: error.message || "Lỗi server" });
      }
    }),

  loginUserController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { username, password } = req.body;

        const result = await UserService.loginUserService({ username, password });

        return res.status(result.status).json({
          status: result.status,
          message: result.message || "Đăng nhập thành công",
          data: {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          },
        });
      } catch (error) {
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi đăng nhập",
        });
      }
    }),

  resetTokenController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { access_token, refresh_token } = req.body;

        const result = await UserService.resetTokenService({ access_token, refresh_token });

        return res.status(result.status).json({
          status: result.status,
          message: result.message || "Làm mới token thành công",
          data: {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          },
        });
      } catch (error) {
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi làm mới token",
        });
      }
    }),

  getCurrentLoginController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        // Lấy thông tin user từ req.user (do middleware auth thiết lập)
        const result = await UserService.getCurrentLoginService(req.user);

        return res.status(result.status).json({
          status: result.status,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          status: 500,
          message: error.message || "Lỗi server khi lấy thông tin người dùng",
        });
      }
    }),
  updateUserController: (req, res) =>
  new Promise(async (resolve, reject) => {
    try {
      const userId = req.user._id; 
      console.log(userId);
      const { full_name, email, avatar_url } = req.body; // Loại bỏ password

      const result = await UserService.updateUserService(userId, {
        full_name,
        email,
        avatar_url,
      });

      return res.status(result.status).json({
        status: result.status,
        message: result.message || "Cập nhật thông tin người dùng thành công",
      });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({
        status: 500,
        message: error.message || "Lỗi server khi cập nhật thông tin người dùng",
      });
    }
  }),
  changePasswordController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        const result = await UserService.changePasswordService(userId, currentPassword, newPassword);

        return res.status(result.status).json({
          status: result.status,
          message: result.message || "Đổi mật khẩu thành công",
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          status: 500,
          message: error.message || "Lỗi server khi đổi mật khẩu",
        });
      }
    }),
};