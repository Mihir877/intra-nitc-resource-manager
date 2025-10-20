import { Router } from "express";
import {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  setResourceStatus,
  deleteResource,
} from "../controllers/resource.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * PUBLIC / AUTH ROUTES
 * --------------------
 * - Students & Faculty can view and browse resources
 * - Admin can perform full CRUD
 */

// Fetch all resources (available to all authenticated users)
router.get("/", verifyJWT, getAllResources);

// Get a single resource by ID
router.get("/:id", verifyJWT, getResourceById);

/**
 * ADMIN-ONLY ROUTES
 * --------------------
 * All routes below this point require:
 * 1. Authentication via verifyJWT middleware
 * 2. Admin role verification via requireAdmin middleware
 */
router.use(verifyJWT);
router.use(requireAdmin);
  
// Create a new resource
router.post("/", createResource);

// Update resource details
router.patch("/:id", updateResource);

// Set resource status
router.patch("/:id/status", setResourceStatus);

// Soft delete resource
router.delete("/:id", deleteResource);

export default router;
