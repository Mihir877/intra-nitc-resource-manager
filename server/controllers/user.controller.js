import { User } from "../models/user.model.js";

// Constants
const USER_ACTIVITY_TYPES = {
  CHANGE_PASSWORD: "change_password",
  EDIT_PROFILE: "edit_profile",
  RETRIEVE_DATA: "retrieve_data",
};

// Change current password (authenticated)
const changeCurrentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid old password" });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Password changed successfully",
      activityType: USER_ACTIVITY_TYPES.CHANGE_PASSWORD,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Assign role to a user
const assignRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Role changed for the user",
      activityType: USER_ACTIVITY_TYPES.EDIT_PROFILE,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Get current authenticated user
const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      statusCode: 200,
      user: req.user,
      message: "Current user fetched successfully",
      activityType: USER_ACTIVITY_TYPES.RETRIEVE_DATA,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Get all users except current
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const users = await User.find({ _id: { $ne: currentUserId } }).select(
      "avatar username email"
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      users,
      message: "List of all users",
      activityType: USER_ACTIVITY_TYPES.RETRIEVE_DATA,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Update user profile (authenticated)
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    // Whitelist fields that can be updated
    const allowedUpdates = [
      "name",
      "bio",
      "phoneNumber",
      "gender",
      "address",
      "dateOfBirth",
      "avatar",
    ];
    const updates = {};

    // Copy only allowed fields from req.body
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      user: updatedUser,
      message: "Profile updated successfully",
      activityType: USER_ACTIVITY_TYPES.EDIT_PROFILE,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

export {
  changeCurrentPassword,
  assignRole,
  getCurrentUser,
  getAllUsers,
  updateUserProfile,
};
