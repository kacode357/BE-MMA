// middlewares/authMiddleware.js
const isAdmin = (req, res, next) => {
    // Assuming req.user is populated by authentication middleware
    if (req.user && req.user.role === 'admin') {
      return next(); // User is an admin, proceed to the next middleware or route handler
    }
  
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  };
  
  module.exports = { isAdmin };
  