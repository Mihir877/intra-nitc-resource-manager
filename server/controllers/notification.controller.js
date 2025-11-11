// controllers/notification.controller.js
import { Notification } from "../models/notification.model.js";
import { createNotification as createNotificationService } from "../utils/notification.service.js"; // your existing one

// ✅ Create notification (calls your service)
export const createNotification = async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      type,
      relatedRequestId,
      channels,
      emailPayload,
    } = req.body;

    if (!userId || !title || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // You might load user from DB or middleware
    const user = req.user || { _id: userId };

    const notification = await createNotificationService({
      user,
      title,
      message,
      type,
      relatedRequestId,
      channels,
      emailPayload,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create notification" });
  }
};

// ✅ Get recent notifications
export const getRecentNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Mark all as read
export const markAllRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Clear all notifications
export const clearNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ userId });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
