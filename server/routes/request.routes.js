import { Router } from "express";
import {
  createRequest,
  getRequests,
  getPendingRequests,
  decisionRequest,
  cancelRequest,
  getRequestHistory,
  archiveOldRequests,
  countRequests,
  getMyRequests,
  getRequestById,
} from "../controllers/request.controller.js";

import { verifyJWT, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// ----- Core Routes -----
router.post("/", createRequest);
router.get("/", getRequests);
router.get("/my", getMyRequests);

// ----- New: Get only pending requests -----
router.get("/pending", requireAdmin, getPendingRequests);

router.get("/:id", getRequestById);

// ----- New: Get count of different requests -----
router.get("/count", countRequests);

// ----- Others -----
router.patch("/:id/cancel", cancelRequest);
router.get("/history", getRequestHistory);
router.post("/archive", requireAdmin, archiveOldRequests);

// ----- Admin Approve/Reject -----
router.patch("/:id/:decision", requireAdmin, decisionRequest);

export default router;
