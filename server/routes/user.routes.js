import { Router } from "express";

import {
  getCurrentUser,
  changeCurrentPassword,
  assignRole,
  getAllUsers,
  updateUserProfile
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protected routes (all require authentication)
router.get("/me", verifyJWT, getCurrentUser);
router.get("/get-all-users", verifyJWT, getAllUsers);
router.post("/assign-role/:userId", verifyJWT, assignRole);
router.patch("/update-profile", verifyJWT, updateUserProfile);
router.post("/change-password", verifyJWT, changeCurrentPassword);

export default router;
