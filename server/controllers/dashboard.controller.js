// controllers/dashboard.controller.js
import { Resource } from "../models/resource.model.js";
import { Request } from "../models/request.model.js";
import { User } from "../models/user.model.js";

// @desc     Admin Dashboard Stats
// @route    GET /api/v1/dashboard/stats
// @access   Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Resources
    const [totalResources, availableResources, inUse] = await Promise.all([
      Resource.countDocuments({}),
      Resource.countDocuments({ status: "available", isActive: true }),
      Resource.countDocuments({ status: "in-use" }),
    ]);

    // Requests
    const pendingRequestsCount = await Request.countDocuments({
      status: "pending",
    });

    // Users
    const totalUsers = await User.countDocuments({});

    // Utilization
    const utilization =
      totalResources === 0 ? 0 : Math.round((inUse / totalResources) * 100);

    // Pending request details (limit 3, newest first)
    const pendingRequestList = await Request.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("userId", "username email")
      .populate("resourceId", "name type")
      .select(
        "status startTime endTime duration createdAt updatedAt userId resourceId"
      )
      .lean();

    // Recent Activity (last 3 by updatedAt)
    const recentActivity = await Request.find({})
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate("userId", "username email")
      .populate("resourceId", "name type")
      .select(
        "status startTime endTime duration createdAt updatedAt userId resourceId"
      )
      .lean();

    res.json({
      success: true,
      stats: {
        totalResources,
        availableResources,
        pendingRequests: pendingRequestsCount,
        totalUsers,
        utilization,
      },
      pendingRequests: pendingRequestList.map((r) => ({
        _id: r._id,
        status: r.status,
        startTime: r.startTime,
        endTime: r.endTime,
        duration:
          r.duration ??
          (r.startTime && r.endTime
            ? Math.max(
                0,
                Math.round((new Date(r.endTime) - new Date(r.startTime)) / 36e5)
              )
            : null),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userId: r.userId
          ? {
              _id: r.userId._id,
              username: r.userId.username,
              email: r.userId.email,
            }
          : null,
        resourceId: r.resourceId
          ? {
              _id: r.resourceId._id,
              name: r.resourceId.name,
              type: r.resourceId.type,
            }
          : null,
      })),
      recentActivity: recentActivity.map((r) => ({
        _id: r._id,
        status: r.status,
        startTime: r.startTime,
        endTime: r.endTime,
        duration:
          r.duration ??
          (r.startTime && r.endTime
            ? Math.max(
                0,
                Math.round((new Date(r.endTime) - new Date(r.startTime)) / 36e5)
              )
            : null),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userId: r.userId
          ? {
              _id: r.userId._id,
              username: r.userId.username,
              email: r.userId.email,
            }
          : null,
        resourceId: r.resourceId
          ? {
              _id: r.resourceId._id,
              name: r.resourceId.name,
              type: r.resourceId.type,
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
