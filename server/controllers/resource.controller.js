import { Resource } from "../models/resource.model.js";

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

    // Check if resource already exists
    const existing = await Resource.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Resource with this name already exists" });
    }

    const resource = await Resource.create({
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
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      resource,
      message: "Resource created successfully",
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
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

    const resources = await Resource.find(filters).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      statusCode: 200,
      count: resources.length,
      resources,
      message: "Resources fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
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
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      resource,
      message: "Resource details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

/**
 * @desc    Update a resource
 * @route   PATCH /api/v1/resources/:id
 * @access  Admin
 */
export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      { ...updates, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!updatedResource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      resource: updatedResource,
      message: "Resource updated successfully",
    });
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

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
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    resource.status = status;
    resource.isActive = status !== "disabled";
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
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
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
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    resource.isActive = false;
    resource.status = "disabled";
    await resource.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Resource has been disabled (soft deleted)",
    });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};
