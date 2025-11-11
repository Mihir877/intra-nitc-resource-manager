// controllers/dashboard.controller.js
import { Resource } from "../models/resource.model.js";
import { Request } from "../models/request.model.js";
import { User } from "../models/user.model.js";

// @desc     Admin Dashboard Stats
// @route    GET /api/v1/dashboard/stats
// @access   Admin
export const getAdminDashboard = async (req, res) => {
  try {
    // non-admin users
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can access the dashboard.",
      });
    }

    // user's department (if any)
    const department = req.user.department || null;

    // Department-scoped filters
    let deptResourceFilter = {};
    let deptRequestFilter = {};

    if (department) {
      deptResourceFilter.department = department;

      // Preload department resource IDs for request filtering
      const deptResources = await Resource.find(deptResourceFilter).select(
        "_id"
      );
      const deptResourceIds = deptResources.map((r) => r._id);
      deptRequestFilter.resourceId = { $in: deptResourceIds };
    }

    // --- Global Stats ---
    const [totalResources, availableResources, inUse] = await Promise.all([
      Resource.countDocuments({}),
      Resource.countDocuments({ status: "available", isActive: true }),
      Resource.countDocuments({ status: "in-use" }),
    ]);

    const pendingRequestsCount = await Request.countDocuments({
      status: "pending",
    });
    const totalUsers = await User.countDocuments({});
    const utilization =
      totalResources === 0 ? 0 : Math.round((inUse / totalResources) * 100);

    // --- Department Stats (if applicable) ---
    const [
      deptResourcesCount,
      availableDeptResourcesCount,
      deptPendingRequestsCount,
    ] = department
      ? await Promise.all([
          Resource.countDocuments(deptResourceFilter),
          Resource.countDocuments({
            ...deptResourceFilter,
            status: "available",
            isActive: true,
          }),
          Request.countDocuments({ status: "pending", ...deptRequestFilter }),
        ])
      : [0, 0, 0];

    // Pending Requests (limit 3)
    const pendingRequestList = await Request.find({
      status: "pending",
      ...(department ? deptRequestFilter : {}),
    })
      .sort({ createdAt: 1 })
      .limit(3)
      .populate("userId", "username email")
      .populate("resourceId", "name type department")
      .lean();

    // Recent Activity (limit 3)
    const recentActivity = await Request.find(
      department ? deptRequestFilter : {}
    )
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate("userId", "username email")
      .populate("resourceId", "name type department")
      .lean();

    // Response payload
    res.json({
      success: true,
      stats: {
        totalResources,
        deptResources: deptResourcesCount,
        availableResources,
        availableDeptResources: availableDeptResourcesCount,
        pendingRequests: pendingRequestsCount,
        totalUsers,
        utilization,
        department: department || "All Departments",
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
              department: r.resourceId.department,
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
              department: r.resourceId.department,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error in getAdminDashboard:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// controllers/dashboard.controller.js

export const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all requests for this user
    const allRequests = await Request.find({ userId })
      .populate("resourceId", "name type")
      .sort({ createdAt: -1 })
      .lean();

    // Compute stats
    const totalRequests = allRequests.length;
    const approvedRequests = allRequests.filter((r) => r.status === "approved");
    const pendingRequests = allRequests.filter((r) => r.status === "pending");
    const rejectedRequests = allRequests.filter((r) => r.status === "rejected");

    const totalHours = approvedRequests.reduce((sum, r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      return sum + (end - start) / 36e5; // hours
    }, 0);

    // Recent and Upcoming (limit 5 each)
    const recentRequests = allRequests.slice(0, 5);
    const approvedUpcoming = approvedRequests
      .filter((r) => new Date(r.startTime) > new Date())
      .slice(0, 5);

    // Return consolidated response
    res.status(200).json({
      success: true,
      stats: {
        totalRequests,
        approvedRequests: approvedRequests.length,
        pendingRequests: pendingRequests.length,
        rejectedRequests: rejectedRequests.length,
        totalHours: Math.round(totalHours),
      },
      recentRequests,
      approvedUpcoming,
    });
  } catch (error) {
    console.error("Error in student dashboard:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
