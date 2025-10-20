import Mailgen from "mailgen";
import nodemailer from "nodemailer";

/**
 * ------------------------------------------------------------------
 *  Core Email Utility for Intra NITC Resource Management System (IRMS)
 * ------------------------------------------------------------------
 *  Supports:
 *   - User account verification & password reset
 *   - Booking approval / rejection / cancellation notifications
 * ------------------------------------------------------------------
 */

/**
 * Sends an email using Mailgen + Nodemailer
 * @param {{email: string; subject: string; mailgenContent: Mailgen.Content}} options
 */
const sendEmail = async (options) => {
  // Initialize Mailgen with IRMS branding
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Intra NITC Resource Management (IRMS)",
      link: "http://localhost:3000", // Replace with actual domain or localhost
      // logo: "http://localhost:8080/public/logos/nitc_logo.png",
      logoHeight: "60px",
    },
  });

  // Generate text + HTML content
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  // Configure Nodemailer transporter (Mailtrap or production SMTP)
  const transporter = nodemailer.createTransport({
  service: "gmail",
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "NITC Resource Management",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
    console.log(`✅ Email sent successfully to ${options.email}`);
  } catch (error) {
    console.log("⚠️ Email service failed silently.");
    console.log("Error details:", error.message);
  }
};

//
// -------------------------------------------------------------
//  Mail Template Functions
// -------------------------------------------------------------
//

/**
 * Email verification mail (for registration)
 */
const emailVerificationMailgenContent = (username, verificationUrl) => ({
  body: {
    name: username,
    intro: "Welcome to the Intra NITC Resource Management System!",
    action: {
      instructions:
        "To verify your IRMS account, please click the button below:",
      button: {
        color: "#0b5ed7",
        text: "Verify My Email",
        link: verificationUrl,
      },
    },
    outro: "If you did not initiate this, please ignore this message.",
  },
});

/**
 * Forgot password mail
 */
const forgotPasswordMailgenContent = (username, passwordResetUrl) => ({
  body: {
    name: username,
    intro: "We received a request to reset your IRMS account password.",
    action: {
      instructions: "Click the button below to reset your password:",
      button: {
        color: "#dc3545",
        text: "Reset Password",
        link: passwordResetUrl,
      },
    },
    outro:
      "If you didn’t request a password reset, no action is needed. Your account remains secure.",
  },
});

/**
 * Booking approval notification
 */
const bookingApprovedMail = (username, resourceName, bookingTime) => ({
  body: {
    name: username,
    intro: `Good news! Your booking request for **${resourceName}** has been approved.`,
    table: {
      data: [{ Resource: resourceName, "Approved Time Slot": bookingTime }],
    },
    outro: "You can view details in your IRMS dashboard.",
  },
});

/**
 * Booking rejection notification
 */
const bookingRejectedMail = (username, resourceName, reason) => ({
  body: {
    name: username,
    intro: `Your booking request for **${resourceName}** was rejected.`,
    dictionary: { Reason: reason },
    outro:
      "Please check other available time slots or contact your department admin for clarification.",
  },
});

/**
 * Booking cancellation (admin-initiated)
 */
const bookingCancelledMail = (username, resourceName, reason) => ({
  body: {
    name: username,
    intro: `Your approved booking for **${resourceName}** has been cancelled by the admin.`,
    dictionary: { Reason: reason },
    outro:
      "We regret the inconvenience. You may rebook another available slot from your dashboard.",
  },
});

//
// -------------------------------------------------------------
//  Module Exports
// -------------------------------------------------------------
export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  bookingApprovedMail,
  bookingRejectedMail,
  bookingCancelledMail,
};
