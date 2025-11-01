import { Request } from "../models/request.model.js";
import { Resource } from "../models/resource.model.js";
import mongoose from "mongoose";
import { createNotification } from "../utils/notification.service.js";

/**
 * @desc    Submit a new resource request
 * @route   POST /api/v1/requests
 * @access  Authenticated users (student/faculty)
 */
export const createRequest = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, purpose } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not available" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid time range" });
    }

    // HOURS-ONLY CHECK
    const durationHours = (end - start) / 36e5; // 1000*60*60
    const maxHours = Number(resource.maxBookingDuration ?? 0);
    if (maxHours > 0 && durationHours > maxHours) {
      return res.status(400).json({
        success: false,
        message: `Requested duration (${durationHours.toFixed(
          2
        )}h) exceeds max allowed (${maxHours}h)`,
      });
    }

    // conflict including containment
    const conflict = await Request.findOne({
      resourceId,
      status: { $in: ["pending", "approved"] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { $and: [{ startTime: { $lte: start } }, { endTime: { $gte: end } }] },
      ],
    });
    if (conflict) {
      return res
        .status(409)
        .json({ success: false, message: "Time slot already booked" });
    }

    const request = await Request.create({
      userId: req.user._id,
      resourceId,
      startTime: start,
      endTime: end,
      purpose,
      status: resource.requiresApproval ? "pending" : "approved",
      approvedBy: resource.requiresApproval ? null : req.user._id,
      approvedAt: resource.requiresApproval ? null : new Date(),
    });

    return res
      .status(201)
      .json({
        success: true,
        statusCode: 201,
        request,
        message: "Request submitted successfully",
      });
  } catch (error) {
    console.error("Error creating request:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

/**
 * @desc    Get all requests (for admin) or user's own requests
 * @route   GET /api/v1/requests
 * @access  Authenticated
 */
export const getRequests = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== "admin") {
      filter.userId = req.user._id;
    }
    const requests = await Request.find(filter)
      .populate("userId", "username email role")
      .populate("resourceId", "name type location");

    res.status(200).json({
      success: true,
      statusCode: 200,
      count: requests.length,
      requests,
      message: "Requests fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Approve or reject a request (Admin only)
 * @route   PATCH /api/v1/requests/:id/decision
 * @access  Admin
 */
export const decisionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const validStatuses = ["approved", "rejected"];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const request = await Request.findById(id)
      .populate("userId", "email username")
      .populate("resourceId", "name");

    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    const now = new Date();

    // --- Update Request ---
    request.status = status;
    request.approvedBy = req.user._id;
    request.approvedAt = now;

    if (status === "rejected") {
      if (!remarks?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Remarks are required for rejection",
        });
      }
      request.remarks = remarks;
    }

    await request.save();

    // --- Prepare Notification ---
    const { userId: user, resourceId: resource, startTime, endTime } = request;
    const timeSlot = `${new Date(startTime).toLocaleString()} - ${new Date(
      endTime
    ).toLocaleString()}`;

    const isApproved = status === "approved";

    const emailPayload = {
      email: user.email,
      subject: `${
        isApproved ? "✅ Booking Approved" : "❌ Booking Rejected"
      }: ${resource.name}`,
      mailgenContent: {
        body: {
          name: user.username,
          intro: isApproved
            ? `Your booking for ${resource.name} has been approved!`
            : `Your booking for ${resource.name} has been rejected.`,
          table: {
            data: [
              { Resource: resource.name },
              { "Time Slot": timeSlot },
              ...(!isApproved ? [{ Remarks: remarks }] : []),
            ],
          },
          outro: isApproved
            ? "You can now access the resource during your booked slot."
            : "Please try booking another time slot from the portal.",
        },
      },
    };

    // --- Send Notification ---
    await createNotification({
      user,
      title: isApproved ? "Booking Approved" : "Booking Rejected",
      message: isApproved
        ? `Your booking for ${resource.name} on ${timeSlot} has been approved.`
        : `Your booking for ${resource.name} was rejected. Reason: ${remarks}`,
      type: isApproved ? "success" : "error",
      relatedRequestId: request._id,
      channels: ["in-app", "email"],
      emailPayload,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      request,
      message: `Request has been ${status}`,
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Cancel a request (user or admin)
 * @route   PATCH /api/v1/requests/:id/cancel
 * @access  Authenticated
 */
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const request = await Request.findById(id)
      .populate("userId", "email username")
      .populate("resourceId", "name");

    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    const isAdmin = req.user.role === "admin";
    const isOwner = request.userId.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request",
      });
    }

    // Admin must provide a reason
    if (isAdmin && (!remarks || !remarks.trim())) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required for admins",
      });
    }

    request.status = "cancelled";
    request.remarks =
      remarks?.trim() || (isAdmin ? "Cancelled by admin" : "Cancelled by user");

    await request.save();

    // --- Notify user if admin cancels ---
    if (isAdmin) {
      const {
        userId: user,
        resourceId: resource,
        startTime,
        endTime,
      } = request;
      const timeSlot = `${new Date(startTime).toLocaleString()} - ${new Date(
        endTime
      ).toLocaleString()}`;

      const emailPayload = {
        email: user.email,
        subject: `❌ Booking Cancelled: ${resource.name}`,
        mailgenContent: {
          body: {
            name: user.username,
            intro: `Your booking for ${resource.name} has been cancelled by an admin.`,
            table: {
              data: [
                { Resource: resource.name },
                { "Time Slot": timeSlot },
                { Remarks: request.remarks },
              ],
            },
            outro: "Please try booking another time slot from the portal.",
          },
        },
      };

      await createNotification({
        user,
        title: "Booking Cancelled",
        message: `Your booking for ${resource.name} on ${timeSlot} was cancelled by an admin. Reason: ${request.remarks}`,
        type: "error",
        relatedRequestId: request._id,
        channels: ["in-app", "email"],
        emailPayload,
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      request,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Get request history (user or admin)
 * @route   GET /api/v1/requests/history
 * @access  Authenticated
 */
export const getRequestHistory = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== "admin") {
      filter.userId = req.user._id;
    }

    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "username email role")
      .populate("resourceId", "name type location");

    res.status(200).json({
      success: true,
      statusCode: 200,
      count: requests.length,
      requests,
      message: "Request history fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching request history:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Archive past requests older than yesterday
 * @route   POST /api/v1/requests/archive
 * @access  Admin (can be scheduled via CRON)
 */
export const archiveOldRequests = async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const oldRequests = await Request.find({ endTime: { $lt: yesterday } });
    if (!oldRequests.length) {
      return res
        .status(200)
        .json({ success: true, message: "No old requests to archive" });
    }

    const archived = await mongoose.connection
      .collection("requests_archive")
      .insertMany(oldRequests.map((r) => r.toObject()));

    await Request.deleteMany({ endTime: { $lt: yesterday } });

    res.status(200).json({
      success: true,
      statusCode: 200,
      count: archived.insertedCount,
      message: "Old requests archived successfully",
    });
  } catch (error) {
    console.error("Error archiving old requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ---- Get Only Pending Requests ----
export const getPendingRequests = async (req, res) => {
  try {
    const pending = await Request.find({ status: "pending" })
      .populate("userId", "username email role")
      .populate("resourceId", "name type location");

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: pending,
      count: pending.length,
      message: "Pending requests fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ---- Approve Shortcut ----
export const quickApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id)
      .populate("userId", "email username")
      .populate("resourceId", "name");

    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    request.status = "approved";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();

    await request.save();
    res.status(200).json({
      success: true,
      statusCode: 200,
      request,
      message: "Request approved successfully",
    });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ---- Reject Shortcut ----
export const quickReject = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id)
      .populate("userId", "email username")
      .populate("resourceId", "name");

    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    request.status = "rejected";
    request.remarks = "Rejected by admin (quick action)";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();

    await request.save();
    res.status(200).json({
      success: true,
      statusCode: 200,
      request,
      message: "Request rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
