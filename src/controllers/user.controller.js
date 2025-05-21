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

        return res.status(result.status).json({ data: result });
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

        return res.status(result.status).json({ data: result });
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

        return res.status(result.status).json({ data: result });
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
        const { access_token } = req.body;

        const result = await UserService.getCurrentLoginService({ access_token });

        return res.status(result.status).json({ data: result });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi lấy thông tin người dùng",
        });
      }
    }),
};