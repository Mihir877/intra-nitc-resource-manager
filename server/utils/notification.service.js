import { sendEmail } from "../utils/mail.js";
import { Notification } from "../models/notification.model.js";

export const createNotification = async ({
  userId,
  title,
  message,
  type = "info", // info | success | warning | error
  relatedRequestId,
  channels = ["in-app"],
  emailPayload = {},
}) => {
  try {
    // 1️⃣ Save in-app notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      relatedRequestId,
      status: "pending",
    });

    // 2️⃣ If email channel is selected → send email
    if (channels.includes("email") && emailPayload?.email) {
      try {
        await sendEmail(emailPayload);
        notification.status = "sent";
        await notification.save();
        console.log(`✅ Notification email sent to ${emailPayload.email}`);
      } catch (err) {
        notification.status = "failed";
        console.error("⚠️ Email sending failed:", err.message);
      }
    }

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error.message);
    throw error;
  }
};
