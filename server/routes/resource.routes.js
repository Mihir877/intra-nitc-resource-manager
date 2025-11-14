import { Router } from "express";
import {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  setResourceStatus,
  deleteResource,
  getMostBookedResource,
  scheduleMaintenance,
} from "../controllers/resource.controller.js";

import { requireAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import { getScheduleForResource } from "../controllers/schedule.controller.js";

const router = Router();

/**
 * PUBLIC / AUTH ROUTES
 * --------------------
 * - Students & Faculty can view and browse resources
 * - Admin can perform full CRUD
 */

router.use(verifyJWT);

// Fetch all resources (available to all authenticated users)
router.get("/", getAllResources);

// routes/resource.routes.js (add this line)
router.get("/most-booked", getMostBookedResource);

// Get a single resource by ID
router.get("/:id", getResourceById);

// Schedule view for a resource (next 14 days)
router.get("/:id/schedule", getScheduleForResource);

/**
 * ADMIN-ONLY ROUTES
 * --------------------
 * All routes below this point require:
 * 1. Authentication via verifyJWT middleware
 * 2. Admin role verification via requireAdmin middleware
 */
router.use(requireAdmin);

// Create a new resource
router.post("/", createResource);

// Update resource details
router.patch("/:id", updateResource);

// Set resource status
router.patch("/:id/status", setResourceStatus);

// Soft delete resource
router.delete("/:id", deleteResource);

router.post("/:id/maintenance", scheduleMaintenance);


export default router;
