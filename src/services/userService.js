require('dotenv').config();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;

const createUserAdmin = async () => {
    try {
        const user = await User.findOne({ email: 'admin@gmail.com' });

        if (user) {
            return {
                EC: 1,
                EM: "Admin user already exists"
            };
        }

        const hashPassword = await bcrypt.hash("1234567", saltRounds);
        let result = await User.create({
            name: "admin",
            email: "admin@gmail.com",
            phone_number: "",
            avatar: "",
            password: hashPassword,
            role: "admin",
            is_deleted: false,
            status: "active"
        });

        return {
            EC: 0,
            result: {
                name: result.name,
                email: result.email,
                phoneNumber: result.phone_number,
                avatar: result.avatar,
                role: result.role,
                status: result.status,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt
            }
        };
    } catch (error) {
        console.log(error);
        return {
            EC: 1,
            EM: "An error occurred while creating the admin user"
        };
    }
};

const createUserService = async (name, email, phone_number, avatar, password, role) => {
    try {
        const user = await User.findOne({ email });

        if (user) {
            return {
                EC: 1,
                EM: `Email ${email} already in use`
            };
        }

        const hashPassword = await bcrypt.hash(password, saltRounds);
        const defaultAvatar = avatar || '';

        let result = await User.create({
            name,
            email,
            phone_number,
            avatar: defaultAvatar,
            password: hashPassword,
            role,
            is_deleted: false,
            status: "active"
        });

        return {
            EC: 0,
            result: {
                name: result.name,
                email: result.email,
                phone_number: result.phone_number,
                avatar: result.avatar,
                role: result.role,
                status: result.status,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt
            }
        };
    } catch (error) {
        console.log(error);
        return {
            EC: 1,
            EM: "An error occurred while creating the user"
        };
    }
};

const loginService = async (email, password) => {
    try {
        const user = await User.findOne({ email });

        if (user) {
            // Kiểm tra nếu người dùng bị khóa hoặc bị xóa
            if (user.status === 'inactive') {
                return {
                    EC: 3,
                    EM: "Your account is inactive. Please contact support."
                };
            }

            if (user.is_deleted) {
                return {
                    EC: 4,
                    EM: "Your account has been deleted. Please contact support."
                };
            }

            // Kiểm tra mật khẩu
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return {
                    EC: 2,
                    EM: "Email/Password is incorrect"
                };
            } else {
                // Tạo JWT token khi đăng nhập thành công
                const payload = {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
                const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

                return {
                    EC: 0,
                    accessToken,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email
                    }
                };
            }
        } else {
            return {
                EC: 1,
                EM: "Email/Password is incorrect"
            };
        }
    } catch (error) {
        console.log(error);
        return null;
    }
};


const findById = async (userId) => {
    try {
     
        const user = await User.findById(userId);

        if (!user) {
            return {
                EC: 1,
                EM: "User not found"
            };
        }

        return {
            EC: 0,
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone_number: user.phone_number,
                avatar: user.avatar,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        };
    } catch (error) {
        console.log(error);
        return {
            EC: 1,
            EM: "An error occurred while retrieving the user"
        };
    }
};

const getUserService = async (searchCondition, pageInfo) => {
    try {
        const searchQuery = {};

        if (searchCondition.keyword) {
            searchQuery.$or = [
                { name: { $regex: searchCondition.keyword, $options: 'i' } },
                { email: { $regex: searchCondition.keyword, $options: 'i' } }
            ];
        }

        if (searchCondition.role && searchCondition.role !== 'all') {
            searchQuery.role = searchCondition.role;
        }

        if (searchCondition.status && ['active', 'inactive'].includes(searchCondition.status)) {
            searchQuery.status = searchCondition.status;
        }

        if (typeof searchCondition.is_deleted === 'boolean') {
            searchQuery.is_deleted = searchCondition.is_deleted;
        }

        const { pageNum = 1, pageSize = 10 } = pageInfo;
        const skip = (pageNum - 1) * pageSize;
        const limit = pageSize;

        const users = await User.find(searchQuery).skip(skip).limit(limit);
        const totalItems = await User.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            users,
            pageNum,
            pageSize,
            totalItems,
            totalPages
        };
    } catch (error) {
        console.log(error);
        return {
            message: "Error retrieving users",
            error
        };
    }
};

const updateUserService = async (userId, updates) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            return {
                EC: 1,
                EM: "User not found"
            };
        }

        Object.assign(user, updates);
        await user.save();

        return {
            EC: 0,
            user
        };
    } catch (error) {
        console.log(error);
        return {
            EC: 1,
            EM: "Error updating user"
        };
    }
};
const changePasswordService = async (userId, oldPassword, newPassword) => {
    try {
      // Find the user by ID
      const user = await User.findById(userId);
      
      // Check if the user exists
      if (!user) {
        return {
          EC: 1,
          EM: "User not found",
        };
      }
      console.log(">>>>>>>>>>",oldPassword);
      // Compare the old password with the stored hashed password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return {
          EC: 1,
          EM: "Old password is incorrect",
        };
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update the user's password
      user.password = hashedPassword;
      await user.save();
  
      return {
        EC: 0,
        EM: "Password changed successfully",
      };
    } catch (error) {
      console.log(error);
      return {
        EC: 1,
        EM: "An error occurred while changing the password",
      };
    }
  };
  const deleteUserService = async (userId) => {
    try {
      // Find the user by ID
      const user = await User.findById(userId);
  
      // Check if the user exists
      if (!user) {
        return {
          EC: 1,
          EM: "User not found",
        };
      }
  
      // Mark the user as deleted
      user.is_deleted = true;
      await user.save();
  
      return {
        EC: 0,
        EM: "User deleted successfully",
      };
    } catch (error) {
      console.log(error);
      return {
        EC: 1,
        EM: "Error deleting user",
      };
    }
  };
  const changeUserRoleService = async (userId, newRole) => {
    try {
      // Find the user by the given ID
      const user = await User.findById(userId);
  
      // Check if the user exists
      if (!user) {
        return {
          EC: 1,
          EM: "User not found",
        };
      }
  
      // Update the user's role
      user.role = newRole;
      await user.save();
  
      return {
        EC: 0,
        EM: "Role changed successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        EC: 1,
        EM: "Error changing role",
      };
    }
  };
  const changeUserStatusService = async (userId, newStatus) => {
    try {
      // Ensure the status is either 'active' or 'inactive'
      if (newStatus !== 'active' && newStatus !== 'inactive') {
        return {
          EC: 1,
          EM: "Status must be either 'active' or 'inactive'.",
        };
      }
  
      // Find the user by the given ID
      const user = await User.findById(userId);
  
      // Check if the user exists
      if (!user) {
        return {
          EC: 1,
          EM: "User not found",
        };
      }
  
      // Update the user's status
      user.status = newStatus;
      await user.save();
  
      return {
        EC: 0,
        EM: "Status changed successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          status: user.status,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        EC: 1,
        EM: "Error changing status",
      };
    }
  };
  
  
module.exports = {
    createUserService,
    loginService,
    getUserService,
    updateUserService,
    createUserAdmin,
    findById,
    changePasswordService,
    deleteUserService,
    changeUserRoleService,
    changeUserStatusService
};
