import { Router } from "express";
import {
  createRequest,
  getRequests,
  decisionRequest,
  cancelRequest,
  getRequestHistory,
  getScheduleForResource,
  archiveOldRequests,
} from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// User submits a request
router.post("/", verifyJWT, createRequest);

// Fetch requests (admin sees all, user sees own)
router.get("/", verifyJWT, getRequests);

// Admin approves or rejects
router.patch("/:id/decision", verifyJWT, decisionRequest);

// Cancel a request (owner or admin)
router.patch("/:id/cancel", verifyJWT, cancelRequest);

// Request history
router.get("/history", verifyJWT, getRequestHistory);

// Schedule view for a resource (next 14 days)
router.get("/schedule/:resourceId", verifyJWT, getScheduleForResource);

// Archive old requests (admin / cron)
router.post("/archive", verifyJWT, archiveOldRequests);

export default router;
