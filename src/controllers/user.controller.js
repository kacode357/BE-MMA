const UserService = require("../services/user.service");

module.exports = {
  createUserController: async (req, res) => {
    try {
      const { username, password, role, is_active } = req.body;  // Giữ lại role và is_active

      if (!username || !password) {
        return res.status(400).json({ message: "Tên người dùng và mật khẩu là bắt buộc" });
      }

      const result = await UserService.createUserService({
        username,
        password,
        role,
        is_active,
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error(error.message);
      if (error.code === 11000) {
        return res.status(400).json({ ok: false, message: "Dữ liệu trùng lặp, kiểm tra lại username" });
      }
      return res.status(500).json({ ok: false, message: "Lỗi server" });
    }
  },

 // Controller - loginUserController
 loginUserController: async (req, res) => {
  try {
    const { username, password, latitude, longitude } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!username || !password || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        ok: false,
        message: "Tên người dùng, mật khẩu và vị trí là bắt buộc",
      });
    }

    // Gọi service để xử lý logic đăng nhập và tạo token
    const result = await UserService.loginUserService({ username, password, latitude, longitude });

    return res.status(result.status).json({
      message: result.message,
      data: {
        user_id: result.data.user_id,  // Include user_id here
        access_token: result.data.access_token,
        refresh_token: result.data.refresh_token,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      message: error.message || "Lỗi server khi đăng nhập",
    });
  }
},

  refreshTokenController: async (req, res) => {
    try {
      const { access_token, refresh_token } = req.body;

      // Check if both tokens are provided
      if (!access_token || !refresh_token) {
        return res.status(400).json({
          ok: false,
          message: "Access token and refresh token are required",
        });
      }

      // Call the refreshTokenService to validate the tokens and possibly refresh
      const result = await UserService.refreshTokenService(access_token, refresh_token);

      // Return the same tokens if everything is valid
      return res.status(200).json({
        ok: true,
        message: "Tokens are valid",
        data: {
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        },
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        message: error.message || "Error refreshing token",
      });
    }
  },
  getMyLocationController: async (req, res) => {
    try {
      // Lấy userId từ route parameter
      const { userid } = req.params;

      // Kiểm tra nếu userId không có
      if (!userid) {
        return res.status(400).json({
          ok: false,
          message: "Thiếu userId",
        });
      }

      const user = await UserService.getUserLocationsService(userid);

      if (!user) {
        return res.status(404).json({
          ok: false,
          message: "Người dùng không tồn tại",
        });
      }

      return res.status(200).json({
        ok: true,
        message: "Lấy vị trí thành công",
        data: user.locations, // Trả về mảng locations
      });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({
        ok: false,
        message: error.message || "Lỗi server khi lấy vị trí",
      });
    }
  },
   getUserByIdController : async (req, res) => {
    try {
      const { userid } = req.params; // Extract the userId from the request parameters
      console.log(userid);
      const user = await UserService.getUserById(userid); // Call the service to fetch user by ID
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    
      return res.status(200).json({ ok: true, message: "User found", data: user }); // Return the user data
    } catch (error) {
      console.error("Error getting user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
   updateUserController : async (req, res) => {
    try {
      const { userid } = req.params; // Extract the userId from the request parameters
      const updateData = req.body; // Get the data to update from the request body
  
      // Validate the updateData if needed (e.g., check for required fields)
  
      const updatedUser = await UserService.updateUser(userid, updateData); // Call the service to update the user
      
      return res.status(200).json(updatedUser); // Return the updated user data
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
