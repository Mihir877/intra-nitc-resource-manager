// controllers/dashboard.controller.js
import {Resource} from "../models/resource.model.js";
import {Request} from "../models/request.model.js";
import {User} from "../models/user.model.js";

// @desc    Admin Dashboard Stats
// @route   GET /api/v1/dashboard/stats
// @access  Admin (require authentication & isAdmin middleware)
export const getDashboardStats = async (req, res) => {
  try {
    // Resources
    const totalResources = await Resource.countDocuments({});
    const availableResources = await Resource.countDocuments({
      status: "available",
      isActive: true,
    });

    // Requests
    const pendingRequests = await Request.countDocuments({ status: "pending" });

    // Users
    const totalUsers = await User.countDocuments();

    // Utilization calculation (sample: percentage of in-use resources)
    const inUse = await Resource.countDocuments({ status: "in-use" });
    const utilization =
      totalResources === 0 ? 0 : Math.round((inUse / totalResources) * 100);

    // Pending request details
    const pendingRequestList = await Request.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("userId", "username")
      .populate("resourceId", "name")
      .lean();

    // Recent Activity (last 3 actions)
    const recentActivity = await Request.find({})
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate("userId", "username")
      .populate("resourceId", "name")
      .lean();

    res.json({
      success: true,
      stats: {
        totalResources,
        availableResources,
        pendingRequests,
        totalUsers,
        utilization,
      },
      pendingRequests: pendingRequestList,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
