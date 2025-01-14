const {
  createUserService,
  loginService,
  getUserService,
  updateUserService,
  createUserAdmin,
  findById,
  changePasswordService,
  deleteUserService,
  changeUserRoleService,
  changeUserStatusService,
} = require("../services/userService");

const createUser = async (req, res) => {
  const { name, email, phone_number, avatar, password, role } = req.body;
  const data = await createUserService(
    name,
    email,
    phone_number,
    avatar,
    password,
    role
  );

  if (data.EC === 1) {
    return res.status(400).json({
      success: false,
      message: data.EM,
      errors: [],
    });
  }

  return res.status(200).json({
    success: true,
    data: data.result,
  });
};

const generateAdmin = async (req, res) => {
  const data = await createUserAdmin();

  if (data.EC === 1) {
    return res.status(400).json({
      success: false,
      message: data.EM,
      errors: [],
    });
  }

  return res.status(200).json({
    success: true,
    data: data.result,
  });
};

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  const data = await loginService(email, password);

  if (data.EC === 1 || data.EC === 2) {
    return res.status(400).json({
      success: false,
      message: data.EM,
      errors: [],
    });
  }

  if (data.EC === 3 || data.EC === 4) {
    return res.status(403).json({
      success: false,
      message: data.EM,
      errors: [],
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      _id: data.user._id,
      token: data.accessToken,
    },
  });
};

const getUser = async (req, res) => {
  const { searchCondition, pageInfo } = req.body;
  const data = await getUserService(searchCondition, pageInfo);

  return res.status(200).json({
    success: true,
    data,
  });
};

const getCurrentAccount = async (req, res) => {
  try {
  
    const userId = req.user._id;
    const data = await findById(userId);
    if (data.EC === 1) {
      return res.status(404).json({
        success: false,
        message: data.EM,
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      data: data.user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving user",
      errors: [],
    });
  }
};

const updateAccount = async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;

  try {
    const updatedUser = await updateUserService(userId, updates);

    if (updatedUser.EC === 1) {
      return res.status(404).json({
        success: false,
        message: updatedUser.EM,
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: updatedUser.user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error updating account",
      errors: [],
    });
  }
};
const changePassword = async (req, res) => {
  const userId = req.user._id; // Assuming you have middleware that attaches the user object to the req
  const { old_password, new_password } = req.body;
  console.log(req.body);
  try {
    // Call the service to change the password
    const data = await changePasswordService(userId, old_password, new_password);

    if (data.EC === 1) {
      return res.status(400).json({
        success: false,
        message: data.EM,
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error changing password",
      errors: [],
    });
  }
  
};
const deleteAccount = async (req, res) => {
  const userId = req.params.id; // Assuming user ID is passed as a URL parameter

  try {
    // Call the service to mark the account as deleted
    const data = await deleteUserService(userId);

    if (data.EC === 1) {
      return res.status(404).json({
        success: false,
        message: data.EM,
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting account",
      errors: [],
    });
  }
};
const changeRole = async (req, res) => {
  const { user_id, role } = req.body; // Extract user_id and role from the request body

  try {
    // Check if the request has the correct payload
    if (!user_id || !role) {
      return res.status(400).json({
        success: false,
        message: "User ID and role are required.",
        errors: [],
      });
    }

    // Call the service to change the user's role
    const data = await changeUserRoleService(user_id, role);

    if (data.EC === 1) {
      return res.status(400).json({
        success: false,
        message: data.EM,
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Role changed successfully",
      data: data.user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error changing role",
      errors: [],
    });
  }
};
const changeStatus = async (req, res) => {
  const { user_id, status } = req.body; // Extract user_id and status from the request body

  try {
    // Check if the request has the correct payload
    if (!user_id || !status) {
      return res.status(400).json({
        success: false,
        message: "User ID and status are required.",
        errors: [],
      });
    }

    // Call the service to change the user's status
    const data = await changeUserStatusService(user_id, status);

    if (data.EC === 1) {
      return res.status(400).json({
        success: false,
        message: data.EM,
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status changed successfully",
      data: data.user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error changing status",
      errors: [],
    });
  }
};


module.exports = {
  createUser,
  handleLogin,
  getUser,
  updateAccount,
  generateAdmin,
  getCurrentAccount,
  changePassword,
  deleteAccount,
  changeRole,
  changeStatus,
};
