import { Request } from "../models/request.model.js";
import { Resource } from "../models/resource.model.js";
import mongoose from "mongoose";
import { createNotification } from "../utils/notification.service.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Extend plugins (important for .tz())
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Kolkata");

// 💡 Utility: format ISO into human-friendly date
const humanDate = (iso) =>
  iso ? dayjs(iso).tz().format("DD MMM YYYY, h:mm A") : "N/A";

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

// --- Approve/Reject Decision Controller ---
export const decisionRequest = async (req, res) => {
  try {
    const { id, decision } = req.params;
    const { remark } = req.body;

    const decisionMap = { approve: "approved", reject: "rejected" };
    const status = decisionMap[decision];
    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid decision parameter" });
    }

    const request = await Request.findById(id)
      .populate("userId", "email username")
      .populate("resourceId", "name department")
      .lean();

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    // Department check
    if (
      req.user.role === "admin" &&
      req.user.department &&
      request.resourceId.department !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to approve/reject requests from other departments",
      });
    }

    const now = new Date().toISOString();
    await Request.updateOne(
      { _id: id },
      {
        $set: {
          status,
          approvedBy: req.user._id,
          approvedAt: now,
          remarks: status === "rejected" ? remark?.trim() || "" : "",
        },
      }
    );

    const updated = await Request.findById(id)
      .populate("userId", "email username department role isEmailVerified")
      .populate("resourceId", "name department")
      .lean();

    // 📨 Email payload generation
    const isApproved = status === "approved";
    const subjectAction = isApproved ? "Approved ✔️" : "Rejected ❌";

    const emailPayload = {
      email: updated.userId.email,
      subject: `Booking ${subjectAction}: ${updated.resourceId.name}`,
      mailgenContent: {
        body: {
          name: updated.userId.username,
          intro: isApproved
            ? `Good news! Your booking request for **${updated.resourceId.name}** has been *approved*.`
            : `We’re sorry to inform you that your booking request for **${updated.resourceId.name}** has been *rejected*.`,
          table: {
            data: [
              { Resource: updated.resourceId.name },
              { "Start Time": `Start Time: ${humanDate(updated.startTime)}` },
              { "End Time": `End Time: ${humanDate(updated.endTime)}` },
              ...(isApproved
                ? []
                : [{ Remarks: updated.remarks || "No remarks provided" }]),
            ],
          },
          outro: isApproved
            ? "You can now access and use the resource during your booked time slot. Please make sure to follow all usage rules and return the resource in proper condition."
            : "You may try booking another available time slot through the portal. If you believe this was an error, you can reach out to your department admin for clarification.",
          signature: "Best regards,\nNITC Resource Management Team",
        },
      },
    };

    await createNotification({
      user: updated.userId,
      title: isApproved ? "Booking Approved" : "Booking Rejected",
      message: isApproved
        ? `Your booking for ${updated.resourceId.name} has been approved.`
        : `Your booking for ${updated.resourceId.name} was rejected. Reason: ${
            updated.remarks || "No remarks provided."
          }`,
      type: isApproved ? "success" : "error",
      relatedRequestId: updated._id,
      channels: ["in-app", "email"],
      emailPayload,
    });

    res.status(200).json({
      success: true,
      message: `Request has been ${status}`,
      request: updated,
    });
  } catch (error) {
    console.error("Error in decisionRequest:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// @desc Get single request details (with resource & user info)
// @route GET /api/v1/requests/:id
// @access Authenticated (admin or owner)
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id.length !== 24) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID" });
    }

    const request = await Request.findById(id)
      .populate("userId", "username email role")
      .populate(
        "resourceId",
        "name type location department description maxBookingDuration requiresApproval usageRules status images"
      )
      .populate("approvedBy", "username email role")
      .lean();

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    // Authorization check — only admins or owner
    const isAdmin = req.user.role === "admin";
    const isOwner = request.userId._id.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this request" });
    }

    // Duration computation
    const durationHours =
      request.startTime && request.endTime
        ? Math.round(
            (new Date(request.endTime) - new Date(request.startTime)) / 36e5
          )
        : null;

    return res.status(200).json({
      success: true,
      request: {
        ...request,
        durationHours,
      },
      message: "Request details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const remarks = req.body?.remarks || "";

    const request = await Request.findById(id)
      .populate("userId", "email username department role isEmailVerified")
      .populate("resourceId", "name");

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

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

    const finalRemarks =
      remarks?.trim() || (isAdmin ? "Cancelled by admin" : "Cancelled by user");

    request.status = "cancelled";
    request.remarks = finalRemarks;
    await request.save();

    const { userId: user, resourceId: resource, startTime, endTime } = request;

    const timeSlot = `${new Date(startTime).toISOString()} - ${new Date(
      endTime
    ).toISOString()}`;

    const emailPayload = {
      email: user.email,
      subject: `Booking Cancelled: ${resource.name}`,
      mailgenContent: {
        body: {
          name: user.username,
          intro: isAdmin
            ? `Your booking for ${resource.name} has been cancelled by an administrator.`
            : `You have cancelled your booking for ${resource.name}.`,
          table: {
            data: [
              { Resource: resource.name },
              { "Start Time": `Start Time: ${humanDate(updated.startTime)}` },
              { "End Time": `End Time: ${humanDate(updated.endTime)}` },
              { Remarks: finalRemarks },
            ],
          },
          outro: isAdmin
            ? "Please contact your department if you need clarification."
            : "You can book another available slot from the portal anytime.",
        },
      },
    };

    await createNotification({
      user,
      title: "Booking Cancelled",
      message: isAdmin
        ? `Your booking for ${resource.name} on ${timeSlot} was cancelled by an admin. Reason: ${finalRemarks}`
        : `You cancelled your booking for ${resource.name} on ${timeSlot}.`,
      type: "error",
      relatedRequestId: request._id,
      channels: ["in-app", "email"],
      emailPayload,
    });

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

export const getMyRequests = async (req, res) => {
  try {
    // Ensure authenticated
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Query params
    const {
      page = 1,
      limit = 10,
      status, // "pending|approved|rejected|cancelled"
      from, // ISO start bound
      to, // ISO end bound
      sort = "-createdAt", // "-createdAt" | "createdAt" | "-startTime" | "startTime"
      q, // optional purpose search
    } = req.query;

    // Filters
    const filter = { userId };
    if (status) filter.status = status;
    if (from || to) {
      filter.$and = [
        ...(from ? [{ endTime: { $gte: new Date(from) } }] : []),
        ...(to ? [{ startTime: { $lte: new Date(to) } }] : []),
      ];
    }
    if (q && q.trim()) {
      filter.purpose = { $regex: q.trim(), $options: "i" };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * pageSize;

    // Projection keeps payload compact, compute duration client-friendly
    const projection =
      "status purpose startTime endTime createdAt updatedAt remarks approvedAt approvedBy";

    const [total, items] = await Promise.all([
      Request.countDocuments(filter),
      Request.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .select(projection)
        .populate("resourceId", "name type location")
        .populate("approvedBy", "username email role")
        .lean(),
    ]);

    const requests = items.map((r) => {
      const duration =
        r.startTime && r.endTime
          ? Math.max(
              0,
              Math.round((new Date(r.endTime) - new Date(r.startTime)) / 36e5)
            )
          : null;
      return {
        _id: r._id,
        status: r.status,
        purpose: r.purpose || "",
        startTime: r.startTime,
        endTime: r.endTime,
        durationHours: duration,
        remarks: r.remarks ?? "",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        approvedAt: r.approvedAt || null,
        approvedBy: r.approvedBy
          ? {
              _id: r.approvedBy._id,
              username: r.approvedBy.username,
              email: r.approvedBy.email,
              role: r.approvedBy.role,
            }
          : null,
        resource: r.resourceId
          ? {
              _id: r.resourceId._id,
              name: r.resourceId.name,
              type: r.resourceId.type,
              location: r.resourceId.location,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      requests,
      message: "My requests fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching my requests:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const countRequests = async (req, res) => {
  try {
    let filter = {};

    // Non-admin users can only see their own requests
    if (req.user.role !== "admin") {
      filter.userId = req.user._id;
    }

    // Fetch all matching requests
    const requests = await Request.find(filter);

    // Calculate basic counts
    const totalRequests = requests.length;
    const approvedRequests = requests.filter(
      (r) => r.status === "approved"
    ).length;
    const pendingRequests = requests.filter(
      (r) => r.status === "pending"
    ).length;
    const rejectedRequests = requests.filter(
      (r) => r.status === "rejected"
    ).length;

    // Calculate total hours for approved requests
    // Assuming `startTime` and `endTime` are Date objects or ISO strings
    let totalHours = 0;
    requests
      .filter((r) => r.status === "approved")
      .forEach((r) => {
        if (r.startTime && r.endTime) {
          const durationMs = new Date(r.endTime) - new Date(r.startTime);
          const durationHours = durationMs / (1000 * 60 * 60); // Convert ms → hours
          totalHours += durationHours;
        }
      });

    // Round total hours to 2 decimal places
    totalHours = parseFloat(totalHours.toFixed(2));

    // Send response
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Request counts and total hours fetched successfully",
      data: {
        totalRequests,
        approvedRequests,
        pendingRequests,
        rejectedRequests,
        totalHours,
      },
    });
  } catch (error) {
    console.error("Error fetching request counts:", error);
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
    const query = { status: "pending" };

    // If department admin, filter only their department resources
    if (req.user.role === "admin" && req.user.department) {
      const deptResources = await Resource.find({
        department: req.user.department,
      }).select("_id");
      query.resourceId = { $in: deptResources.map((r) => r._id) };
    }

    const pending = await Request.find(query)
      .sort({ createdAt: 1 }) // oldest first
      .populate("userId", "username email role")
      .populate("resourceId", "name type location department");

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

/**
 * @desc Fetch booking requests (pending/approved/rejected)
 * @route GET /requests/pending
 * @access Admin (filtered by department)
 */
export const getRequestsForReview = async (req, res) => {
  try {
    const { role, department } = req.user;
    const { status, search } = req.query;

    // 🧩 Base query
    const query = {
      status: { $in: ["pending", "approved", "rejected"] },
    };

    // 🎯 Department admin restriction
    if (role === "admin" && department) {
      const deptResourceIds = await Resource.find({ department }).distinct(
        "_id"
      );
      query.resourceId = { $in: deptResourceIds };
    }

    // 🔍 Optional filter by status (if provided)
    if (status && status !== "all") {
      query.status = status.toLowerCase();
    }

    // 🔍 Optional search (matches resource name, type, or user)
    const searchFilter = search
      ? {
          $or: [
            { purpose: { $regex: search, $options: "i" } },
            { remarks: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // ⚡ Fetch results
    const requests = await Request.find({ ...query, ...searchFilter })
      .sort({ createdAt: -1 }) // newest first
      .populate("userId", "username email role department")
      .populate("resourceId", "name type location department requiresApproval");

    // 📊 Stats summary for dashboard
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const r of requests) {
      const s = r.status?.toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Requests fetched successfully",
      count: requests.length,
      stats: counts,
      data: requests,
    });
  } catch (error) {
    console.error("❌ Error fetching admin requests:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
