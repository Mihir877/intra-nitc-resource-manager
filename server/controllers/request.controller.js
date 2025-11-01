import { Request } from "../models/request.model.js";
import { Resource } from "../models/resource.model.js";
import mongoose from "mongoose";
import { createNotification } from "../utils/notification.service.js";

export const createRequest = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, purpose } = req.body;

    const resource = await Resource.findById(resourceId).lean();
    if (!resource || !resource.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not available" });
    }

    // Enforce ISO inputs
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid time range" });
    }

    // Domain guard: enforce hour alignment (optional but recommended)
    const alignedStart =
      start.getUTCMinutes() === 0 &&
      start.getUTCSeconds() === 0 &&
      start.getUTCMilliseconds() === 0;
    const alignedEnd =
      end.getUTCMinutes() === 0 &&
      end.getUTCSeconds() === 0 &&
      end.getUTCMilliseconds() === 0;

    if (!alignedStart || !alignedEnd) {
      return res.status(400).json({
        success: false,
        message: "Start/end must be aligned to the hour (UTC).",
      });
    }

    // Duration limit
    const durationHours = (end.getTime() - start.getTime()) / 36e5;
    const maxHours = Number(resource.maxBookingDuration ?? 0);
    if (maxHours > 0 && durationHours > maxHours) {
      return res.status(400).json({
        success: false,
        message: `Requested duration (${durationHours.toFixed(
          2
        )}h) exceeds max allowed (${maxHours}h)`,
      });
    }

    // Conflict check (pending + approved)
    const conflict = await Request.findOne({
      resourceId,
      status: { $in: ["pending", "approved"] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { $and: [{ startTime: { $lte: start } }, { endTime: { $gte: end } }] },
      ],
    }).lean();

    if (conflict) {
      return res
        .status(409)
        .json({ success: false, message: "Time slot already booked" });
    }

    const now = new Date();
    const doc = await Request.create({
      userId: req.user._id,
      resourceId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose,
      status: resource.requiresApproval ? "pending" : "approved",
      approvedBy: resource.requiresApproval ? null : req.user._id,
      approvedAt: resource.requiresApproval ? null : now.toISOString(),
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      request: doc,
      message: "Request submitted successfully",
    });
  } catch (error) {
    console.error("Error creating request:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

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
      .populate("resourceId", "name")
      .lean();

    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    const now = new Date().toISOString();

    await Request.updateOne(
      { _id: id },
      {
        $set: {
          status,
          approvedBy: req.user._id,
          approvedAt: now,
          ...(status === "rejected" ? { remarks: remarks?.trim() || "" } : {}),
        },
      }
    );

    const updated = await Request.findById(id)
      .populate("userId", "email username")
      .populate("resourceId", "name")
      .lean();

    const isApproved = status === "approved";
    const emailPayload = {
      email: updated.userId.email,
      subject: `${
        isApproved ? "✅ Booking Approved" : "❌ Booking Rejected"
      }: ${updated.resourceId.name}`,
      mailgenContent: {
        body: {
          name: updated.userId.username,
          intro: isApproved
            ? `Your booking for ${updated.resourceId.name} has been approved!`
            : `Your booking for ${updated.resourceId.name} has been rejected.`,
          table: {
            data: [
              { Resource: updated.resourceId.name },
              { "Start (UTC ISO)": new Date(updated.startTime).toISOString() },
              { "End (UTC ISO)": new Date(updated.endTime).toISOString() },
              ...(!isApproved ? [{ Remarks: updated.remarks || "" }] : []),
            ],
          },
          outro: isApproved
            ? "You can now access the resource during your booked slot."
            : "Please try booking another time slot from the portal.",
        },
      },
    };

    await createNotification({
      user: updated.userId,
      title: isApproved ? "Booking Approved" : "Booking Rejected",
      message: isApproved
        ? `Your booking for ${updated.resourceId.name} is approved.`
        : `Your booking for ${updated.resourceId.name} was rejected. Reason: ${
            updated.remarks || ""
          }`,
      type: isApproved ? "success" : "error",
      relatedRequestId: updated._id,
      channels: ["in-app", "email"],
      emailPayload,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      request: updated,
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

    if (isAdmin) {
      const {
        userId: user,
        resourceId: resource,
        startTime,
        endTime,
      } = request;
      const timeSlot = `${new Date(startTime).toISOString()} - ${new Date(
        endTime
      ).toISOString()}`;

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
                { "Time Slot (UTC ISO)": timeSlot },
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
