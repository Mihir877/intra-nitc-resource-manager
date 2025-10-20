import { Request } from "../models/request.model.js";
import { Resource } from "../models/resource.model.js";
import mongoose from "mongoose";

/**
 * @desc    Submit a new resource request
 * @route   POST /api/v1/requests
 * @access  Authenticated users (student/faculty)
 */
export const createRequest = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, purpose } = req.body;

    // Check if resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: "Resource not available" });
    }

    // Check for scheduling conflicts
    const conflict = await Request.findOne({
      resourceId,
      status: { $in: ["pending", "approved"] },
      $or: [
        { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
        { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
      ],
    });

    if (conflict) {
      return res.status(409).json({ message: "Time slot already booked" });
    }

    const request = await Request.create({
      userId: req.user._id,
      resourceId,
      startTime,
      endTime,
      purpose,
      status: resource.requiresApproval ? "pending" : "approved",
      approvedBy: resource.requiresApproval ? null : req.user._id,
      approvedAt: resource.requiresApproval ? null : new Date(),
    });

    res.status(201).json({
      statusCode: 201,
      data: request,
      message: "Request submitted successfully",
    });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
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
      statusCode: 200,
      count: requests.length,
      data: requests,
      message: "Requests fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
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
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (status === "approved") {
      // Check conflict again before approval
      const conflict = await Request.findOne({
        resourceId: request.resourceId,
        status: "approved",
        $or: [
          { startTime: { $lt: request.endTime, $gte: request.startTime } },
          { endTime: { $gt: request.startTime, $lte: request.endTime } },
        ],
      });
      if (conflict) {
        return res.status(409).json({ message: "Time slot already booked" });
      }
      request.status = "approved";
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
    } else {
      request.status = "rejected";
      request.rejectionReason = rejectionReason || "Not specified";
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
    }

    await request.save();

    res.status(200).json({
      statusCode: 200,
      data: request,
      message: `Request has been ${status}`,
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
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
    const request = await Request.findById(id);

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (req.user.role !== "admin" && !request.userId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this request" });
    }

    request.status = "cancelled";
    request.remarks = req.body.remarks || "Cancelled by user/admin";
    await request.save();

    res.status(200).json({
      statusCode: 200,
      data: request,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling request:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
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
      statusCode: 200,
      count: requests.length,
      data: requests,
      message: "Request history fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching request history:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

/**
 * @desc    Get schedule view for a resource (next 14 days)
 * @route   GET /api/v1/requests/schedule/:resourceId
 * @access  Authenticated
 */
export const getScheduleForResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    // First get the resource details
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const schedule = await Request.find({
      resourceId,
      status: "approved",
      endTime: { $gte: today },
      startTime: { $lte: twoWeeksLater },
    })
      .select("startTime endTime status userId")
      .populate("userId", "username email")
      .populate("resourceId", "name type location isActive");

    res.status(200).json({
      statusCode: 200,
      count: schedule.length,
      resource: resource.toObject(),
      data: schedule,
      message: "Schedule fetched successfully for the next 14 days",
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
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
    if (!oldRequests.length)
      return res.status(200).json({ message: "No old requests to archive" });

    const archived = await mongoose.connection
      .collection("requests_archive")
      .insertMany(oldRequests.map((r) => r.toObject()));

    await Request.deleteMany({ endTime: { $lt: yesterday } });

    res.status(200).json({
      statusCode: 200,
      count: archived.insertedCount,
      message: "Old requests archived successfully",
    });
  } catch (error) {
    console.error("Error archiving old requests:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};
