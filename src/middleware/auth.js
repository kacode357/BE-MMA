require('dotenv').config();
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const white_list = ["/login", "/register", "/", "/users/generate", "/create-food"];
    if (white_list.find(item => '/v1/api' + item === req.originalUrl)) {
        next();
    } else {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
           
            // verify token
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
              
                req.user = {
                    _id: decoded._id,
                    email: decoded.email,
                    name: decoded.name,
                    role: decoded.role
                }
                console.log(decoded);
                next();
            } catch {
                return res.status(401).json({
                    message: "Token bị hết hạn/ hoặc ko hợp lệ"
                })
            }

        } else {
            //return exception
            return res.status(401).json({
                message: "Bạn chưa truyền token header/ token hết hạn"
            })
        }
    }
}

module.exports = auth;