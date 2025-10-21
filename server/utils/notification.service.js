import { sendEmail } from "../utils/mail.js";
import { Notification } from "../models/notification.model.js";

export const createNotification = async ({
  user,
  title,
  message,
  type = "info", // info | success | warning | error
  relatedRequestId,
  channels = ["in-app"],
  emailPayload = {},
}) => {
  try {
    // 1️⃣ Save in-app notification to DB
    const notification = await Notification.create({
      userId: user._id,
      title,
      message,
      type,
      relatedRequestId,
      status: "pending",
    });

    // 2️⃣ Real-time socket notification (if user online)
    if (channels.includes("in-app") && global._io && global._onlineUsers) {
      const socketId = global._onlineUsers.get(user._id.toString());
      if (socketId) {
        global._io.to(socketId).emit("notification", {
          title,
          message,
          type,
          relatedRequestId,
          createdAt: notification.createdAt,
        });
        console.log(`📡 Real-time notification sent to user ${user._id}`);
      }
    }

    // 3️⃣ Email notification (if channel + verified)
    if (
      channels.includes("email") &&
      user.isEmailVerified &&
      emailPayload?.email
    ) {
      try {
        await sendEmail(emailPayload);
        notification.status = "sent";
        console.log(`✅ Notification email sent to ${emailPayload.email}`);
      } catch (err) {
        notification.status = "failed";
        console.error("⚠️ Email sending failed:", err.message);
      }
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error.message);
    throw error;
  }
};
