import { Resource } from "../models/resource.model.js";
import { Request } from "../models/request.model.js";
import { v2 as cloudinary } from "cloudinary";

/**
 * @desc    Create a new resource
 * @route   POST /api/v1/resources
 * @access  Admin
 */
export const createResource = async (req, res) => {
  try {
    const {
      name,
      type,
      category,
      description,
      location,
      availability,
      maxBookingDuration,
      requiresApproval,
      usageRules,
      images,
      capacity,
    } = req.body;

    // Role restriction — only admins or superadmins can create
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can create resources.",
      });
    }

    // Department binding — department admins can create only for their own dept
    let department = req.user.department;
    if (!department && req.user.role === "superadmin") {
      // Superadmins can optionally set department in body
      department = req.body.department;
    }

    if (!department) {
      return res.status(400).json({
        success: false,
        message:
          "Department information missing. Please assign a department before creating a resource.",
      });
    }

    // Prevent duplicate resource names (per department)
    const existing = await Resource.findOne({ name, department });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A resource named "${name}" already exists in ${department} department.`,
      });
    }

    const resource = await Resource.create({
      name,
      type,
      category,
      department,
      description,
      location,
      availability,
      maxBookingDuration,
      requiresApproval,
      usageRules,
      images,
      capacity,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      resource,
      message: `Resource created successfully in ${department} department`,
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Get all resources (with optional filters)
 * @route   GET /api/v1/resources
 * @access  All (admin/faculty/student)
 */
export const getAllResources = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filters = {};

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (search) filters.name = { $regex: search, $options: "i" };

    let resources;
    const user = req.user;

    if (user.role === "admin" && user.department) {
      const deptFilter = { ...filters, department: user.department };

      // Fetch all resources once
      const allResources = await Resource.find(filters).sort({ createdAt: -1 });

      // Separate into department-first order
      const deptResources = allResources.filter(
        (r) => r.department === user.department
      );
      const otherResources = allResources.filter(
        (r) => r.department !== user.department
      );

      // Merge (department resources first)
      resources = [...deptResources, ...otherResources];
    } else {
      // Superadmins or system-level users see all resources normally
      resources = await Resource.find(filters).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      count: resources.length,
      resources,
      message: "Resources fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Get single resource by ID
 * @route   GET /api/v1/resources/:id
 * @access  All
 */
export const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      resource,
      message: "Resource details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Update a resource
 * @route   PATCH /api/v1/resources/:id
 * @access  Admin
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { removedImages = [], images = [], ...updates } = req.body;

    // Role restriction
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can update resources.",
      });
    }

    // Find resource
    const resource = await Resource.findById(id);
    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    // Department restriction for admins
    if (
      req.user.role === "admin" &&
      resource.department !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only edit resources belonging to your department (${req.user.department}).`,
      });
    }

    // Delete removed images from Cloudinary
    if (removedImages.length > 0) {
      for (const imageUrl of removedImages) {
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.warn(
              `⚠️ Failed to delete Cloudinary image ${publicId}:`,
              err.message
            );
          }
        }
      }
    }

    // Prevent changing department unless superadmin
    if (req.user.role !== "superadmin" && updates.department) {
      delete updates.department;
    }

    // 6. Apply updates
    resource.set({
      ...updates,
      images, // new list of remaining images
      lastUpdatedBy: req.user._id,
    });

    await resource.save();

    // 7. Success response
    res.status(200).json({
      success: true,
      statusCode: 200,
      resource,
      message: "Resource updated successfully",
    });
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Helper to extract Cloudinary public_id from URL
function extractPublicId(url) {
  try {
    // Example: https://res.cloudinary.com/demo/image/upload/v1234/folder/image_name.jpg
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    const publicPath = parts.slice(uploadIndex + 2).join("/"); // skip version folder (v1234)
    return publicPath.replace(/\.[^/.]+$/, ""); // remove extension
  } catch {
    return null;
  }
}

/**
 * @desc    Set resource status (enable/disable/maintenance/etc.)
 * @route   PATCH /api/v1/resources/:id/status
 * @access  Admin
 */
export const setResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    resource.status = status;
    resource.isActive = status === "available" || status === "in_use";

    resource.lastUpdatedBy = req.user._id;
    await resource.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      resource,
      message: `Resource status set to ${status} successfully`,
    });
  } catch (error) {
    console.error("Error setting resource status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Delete a resource (soft delete)
 * @route   DELETE /api/v1/resources/:id
 * @access  Admin
 */
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    resource.isActive = false;
    resource.status = "disabled";
    resource.lastUpdatedBy = req.user._id;

    await resource.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Resource has been disabled (soft deleted)",
    });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Get resource with highest booking count
 * @route   GET /api/v1/resources/most-booked
 * @access  Authenticated
 */
export const getMostBookedResource = async (req, res) => {
  try {
    const stats = await Request.aggregate([
      { $group: { _id: "$resourceId", bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 1 },
    ]);

    if (stats.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found",
      });
    }

    const resourceId = stats[0]._id;
    const bookingCount = stats[0].bookingCount;

    const resource = await Resource.findById(resourceId).populate(
      "createdBy",
      "username email"
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      resource,
      bookingCount,
      message: "Most booked resource retrieved",
    });
  } catch (error) {
    console.error("Get most booked resource error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


/**
 * @desc Add a maintenance period to a resource
 * @route POST /api/v1/resources/:id/maintenance
 * @access Admin
 */
export const scheduleMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, reason } = req.body;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Both start and end times are required for maintenance.",
      });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Department restriction
    if (
      req.user.role === "admin" &&
      resource.department !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only manage resources from your department.",
      });
    }

    // Store maintenance period
    resource.maintenancePeriods.push({
      start,
      end,
      reason,
      createdBy: req.user._id,
    });

    // Set status
    resource.status = "maintenance";
    resource.isActive = false;

    await resource.save();

    return res.status(200).json({
      success: true,
      message: "Maintenance period added successfully.",
      resource,
    });
  } catch (error) {
    console.error("Error scheduling maintenance:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};