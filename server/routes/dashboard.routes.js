import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { requireAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/stats", verifyJWT, requireAdmin, getDashboardStats);

export default router;
