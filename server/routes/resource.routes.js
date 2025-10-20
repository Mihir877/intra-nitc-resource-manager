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
 * Protected by verifyJWT middleware, but actual admin role check
 * can be done inside middleware or controller if you add verifyAdmin()
 */

// Create a new resource
router.post("/", verifyJWT, createResource);

// Update resource details
router.patch("/:id", verifyJWT, updateResource);

// Set resource status
router.patch("/:id/status", verifyJWT, setResourceStatus);

// Soft delete resource
router.delete("/:id", verifyJWT, deleteResource);

export default router;
