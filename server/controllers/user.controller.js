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
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const isSelf = req.params.id === "me";
    const userId = isSelf ? req.user._id : req.params.id;

    // Access control
    if (!isSelf && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own profile.",
      });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user,
      isSelf,
      message: "Profile fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get all users except current
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Aggregate to fetch booking stats per user
    let users = await User.aggregate([
      { $match: { _id: { $ne: currentUserId } } },

      // Lookup related bookings
      {
        $lookup: {
          from: "requests",
          localField: "_id",
          foreignField: "userId",
          as: "bookings",
        },
      },

      // Compute booking stats
      {
        $addFields: {
          totalBookings: { $size: "$bookings" },
          activeBookings: {
            $size: {
              $filter: {
                input: "$bookings",
                as: "b",
                cond: { $in: ["$$b.status", ["pending", "approved"]] },
              },
            },
          },
        },
      },
      {
        $project: {
          avatar: 1,
          username: 1,
          email: 1,
          role: 1,
          department: 1,
          gender: 1,
          address: 1,
          isEmailVerified: 1,
          loginType: 1,
          createdAt: 1,
          lastLogin: 1,
          totalBookings: 1,
          activeBookings: 1,
        },
      },
    ]);

    // 🧠 Sort: Department CSE first, then newest users first (by createdAt)
    users = users.sort((a, b) => {
      const aIsCSE = a.department?.toUpperCase() === "CSE" ? 0 : 1;
      const bIsCSE = b.department?.toUpperCase() === "CSE" ? 0 : 1;

      // Prioritize CSE first
      if (aIsCSE !== bIsCSE) return aIsCSE - bIsCSE;

      // Then sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Meta info for frontend stats
    const meta = {
      totalUsers: users.length,
      byRole: users.reduce(
        (acc, u) => {
          acc[u.role] = (acc[u.role] || 0) + 1;
          return acc;
        },
        { student: 0, faculty: 0, admin: 0 }
      ),
      lastUpdated: new Date(),
    };

    return res.status(200).json({
      success: true,
      statusCode: 200,
      users,
      meta,
      message: "List of all users with booking stats (CSE first, newest first)",
      activityType: USER_ACTIVITY_TYPES.RETRIEVE_DATA,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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
      "department",
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
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Delete a user by ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User deleted successfully",
      deletedUserId: id,
      activityType: USER_ACTIVITY_TYPES.DELETE_DATA,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export {
  getCurrentUser,
  getUserProfile,
  getAllUsers,
  updateUserProfile,
  changeCurrentPassword,
  assignRole,
  deleteUser,
};
