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
};
