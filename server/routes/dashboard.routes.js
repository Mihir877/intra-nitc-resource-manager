import express from "express";
import {
  getAdminDashboard,
  getStudentDashboard,
} from "../controllers/dashboard.controller.js";
import { requireAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/student", verifyJWT, getStudentDashboard);
router.get("/admin", verifyJWT, requireAdmin, getAdminDashboard);

export default router;
