import { Router } from "express";
import {
  createRequest,
  getRequests,
  getPendingRequests,
  decisionRequest,
  quickApprove,
  quickReject,
  cancelRequest,
  getRequestHistory,
  archiveOldRequests,
  countRequests,
  getMyRequests,
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

// ----- New: Get count of different requests -----
router.get("/count", countRequests);

// ----- Admin Approve/Reject -----
router.patch("/:id/decision", requireAdmin, decisionRequest);

// ----- New: Quick approve/reject shortcuts -----
router.patch("/:id/approved", requireAdmin, quickApprove);
router.patch("/:id/rejected", requireAdmin, quickReject);

// ----- Others -----
router.patch("/:id/cancel", cancelRequest);
router.get("/history", getRequestHistory);
router.post("/archive", requireAdmin, archiveOldRequests);

export default router;
