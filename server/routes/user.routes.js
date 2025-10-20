import { Router } from "express";

import {
  getCurrentUser,
  changeCurrentPassword,
  assignRole,
  getAllUsers,
  updateUserProfile,
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * USER ROUTES
 * -------------
 * All routes require authentication via verifyJWT middleware
 */

router.use(verifyJWT);

// Protected routes (all require authentication)
router.get("/me", getCurrentUser);
router.get("/get-all-users", getAllUsers);
router.post("/assign-role/:userId", assignRole);
router.patch("/update-profile", updateUserProfile);
router.post("/change-password", changeCurrentPassword);

export default router;
