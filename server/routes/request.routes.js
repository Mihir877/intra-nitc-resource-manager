import { Router } from "express";
import {
  createRequest,
  getRequests,
  decisionRequest,
  cancelRequest,
  getRequestHistory,
  archiveOldRequests,
} from "../controllers/request.controller.js";
import { verifyJWT, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * REQUEST ROUTES
 * -------------
 * All routes require authentication via verifyJWT middleware
 * Some routes require additional admin privileges
 */

router.use(verifyJWT);

// User submits a request
router.post("/", createRequest);

// Fetch requests (admin sees all, user sees own)
router.get("/", getRequests);

// Admin approves or rejects
router.patch("/:id/decision", requireAdmin, decisionRequest);

// Cancel a request (owner or admin)
router.patch("/:id/cancel", cancelRequest);

// Request history
router.get("/history", getRequestHistory);

// Archive old requests (admin / cron)
router.post("/archive", requireAdmin, archiveOldRequests);

export default router;
