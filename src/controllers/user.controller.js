const UserService = require("../services/user.service");

module.exports = {
  createUserController: async (req, res) => {
    try {
      const { username, password, role, full_name, phone, is_active, email } = req.body;

      if (!username || !password || !full_name) {
        return res.status(400).json({ message: "Tên người dùng, mật khẩu và họ tên là bắt buộc" });
      }

      const result = await UserService.createUserService({
        username,
        password,
        role,
        full_name,
        phone,
        is_active,
        email,
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error(error.message);
      if (error.code === 11000) {
        return res.status(400).json({ ok: false, message: "Dữ liệu trùng lặp, kiểm tra lại username hoặc email" });
      }
      return res.status(500).json({ ok: false, message: "Lỗi server" });
    }
  },
  loginUserController: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!username || !password) {
        return res.status(400).json({
          ok: false,
          message: "Tên người dùng và mật khẩu là bắt buộc",
        });
      }

      // Gọi service để xử lý logic
      const result = await UserService.loginUserService({ username, password });

      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        message: error.message || "Lỗi server khi đăng nhập",
      });
    }
  },
};
