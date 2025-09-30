import { Router } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgottenPassword,
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPasswordRequest);
router.post("/reset-password/:resetToken", resetForgottenPassword);

// Protected routes
router.post("/logout", verifyJWT, logoutUser);
router.post("/resend-email-verification", verifyJWT, resendEmailVerification);

export default router;
