import { Router } from "express";

import {
  getCurrentUser,
  changeCurrentPassword,
  assignRole,
  getAllUsers,
  updateUserProfile,
  deleteUser,
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserSchedule } from "../controllers/schedule.controller.js";

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
router.get("/schedule", getUserSchedule);
 router.delete("/delete-account/:id", deleteUser);

export default router;
