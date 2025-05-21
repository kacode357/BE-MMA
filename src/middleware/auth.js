require('dotenv').config();
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const white_list = ["/users", "/users/login", "/users/refresh-token"];
  const path = req.originalUrl.replace('/v1/api', '');

  // Bỏ qua middleware cho các route trong white_list
  if (white_list.includes(path)) {
    return next();
  }

  // Kiểm tra header Authorization
  if (!req.headers || !req.headers.authorization) {
    return res.status(401).json({
      status: 401,
      message: "Không tìm thấy token. Vui lòng cung cấp token trong header Authorization.",
    });
  }

  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      status: 401,
      message: "Token không hợp lệ. Vui lòng cung cấp token theo định dạng Bearer <token>.",
    });
  }

  // Xác minh token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      _id: decoded.id, // Sử dụng 'id' thay vì '_id' để khớp với token
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };
    console.log('Decoded user:', req.user);
    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      message: "Token không hợp lệ hoặc đã hết hạn.",
    });
  }
};

module.exports = auth;