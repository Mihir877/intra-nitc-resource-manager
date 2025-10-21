import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

import { getRandomNumber } from "../utils/helpers.js";

import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";

// Constants (can be imported from a constants file if preferred)
const USER_ACTIVITY_TYPES = {
  USER_REGISTRATION: "user_registration",
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  EMAIL_VERIFICATION: "email_verification",
  FORGOT_PASSWORD_REQUEST: "forgot_password_request",
  RESET_PASSWORD: "reset_password",
};

const UserLoginType = {
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
};

const UserRolesEnum = {
  STUDENT: "student",
  FACULTY: "faculty",
  ADMIN: "admin",
};

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

// Helper function to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found for token generation");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// Register new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existedUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existedUser) {
      return res.status(409).json({
        success: false,
        message: "User with email or username already exists",
      });
    }

    const user = await User.create({
      email,
      password,
      username,
      isEmailVerified: false,
      avatar: {
        url: "",
        localPath: `/images/default/avatar_toy-${getRandomNumber(17)}.jpg`,
      },
      role: role || UserRolesEnum.STUDENT,
    });

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
        user.username,
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/auth/verify-email/${unHashedToken}`
      ),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      user: createdUser,
      message:
        "User registered successfully and verification email has been sent.",
      activityType: USER_ACTIVITY_TYPES.USER_REGISTRATION,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide username or email" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.loginType !== UserLoginType.EMAIL_PASSWORD) {
      return res.status(400).json({
        success: false,
        message: `You have previously registered using ${user.loginType?.toLowerCase()}. Please use the ${user.loginType?.toLowerCase()} login option.`,
      });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid user credentials" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        statusCode: 200,
        user: loggedInUser,
        accessToken,
        refreshToken,
        message: "User logged in successfully",
        activityType: USER_ACTIVITY_TYPES.USER_LOGIN,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { verificationToken } = req.params;
    if (!verificationToken) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email verification token is missing",
        });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(489)
        .json({ success: false, message: "Token is invalid or expired" });
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      statusCode: 200,
      isEmailVerified: true,
      message: "Email is verified",
      activityType: USER_ACTIVITY_TYPES.EMAIL_VERIFICATION,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Resend email verification mail
const resendEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }
    if (user.isEmailVerified) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already verified!" });
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
        user.username,
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/auth/verify-email/${unHashedToken}`
      ),
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      token: unHashedToken,
      message: "Mail has been sent to your mail ID",
      activityType: USER_ACTIVITY_TYPES.EMAIL_VERIFICATION,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshToken: undefined } },
      { new: true }
    );

    res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({
        success: true,
        statusCode: 200,
        message: "User logged out successfully",
        activityType: USER_ACTIVITY_TYPES.USER_LOGOUT,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req?.cookies?.refreshToken || req?.body?.refreshToken;
    if (!incomingRefreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    if (incomingRefreshToken !== user.refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is expired or used" });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json({
        success: true,
        statusCode: 200,
        accessToken,
        refreshToken: newRefreshToken,
        message: "Access token refreshed",
        activityType: USER_ACTIVITY_TYPES.USER_LOGIN,
      });
  } catch (error) {
    console.error(error);
    res
      .status(401)
      .json({
        success: false,
        message: error.message || "Invalid refresh token",
      });
  }
};

// Forgot password request
const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Password reset request",
      mailgenContent: forgotPasswordMailgenContent(
        user.username,
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/auth/reset-password/${unHashedToken}`
      ),
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      token: unHashedToken,
      message: "Password reset mail has been sent on your mail id",
      activityType: USER_ACTIVITY_TYPES.FORGOT_PASSWORD_REQUEST,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

// Reset forgotten password
const resetForgottenPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(489)
        .json({ success: false, message: "Token is invalid or expired" });
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      statusCode: 200,
      pass: newPassword,
      message: "Password reset successfully",
      activityType: USER_ACTIVITY_TYPES.RESET_PASSWORD,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

export {
  registerUser,
  loginUser,
  verifyEmail,
  resendEmailVerification,
  logoutUser,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgottenPassword,
};
