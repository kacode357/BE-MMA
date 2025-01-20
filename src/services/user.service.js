const UserModel = require("../models/user.model");

module.exports = {
  createUserService: (userData) =>
    new Promise(async (resolve, reject) => {
      try {
        const newUser = await UserModel.create(userData);
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

  loginUserService: ({ username, password }) =>
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

        // Đăng nhập thành công, trả về ID người dùng
        resolve({
          status: 200,
          message: "Đăng nhập thành công",
          user_id: user._id,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi đăng nhập",
        });
      }
    }),
};
