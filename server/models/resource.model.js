import mongoose, { Schema } from "mongoose";

const resourceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Resource name is required"],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      // enum: ["instrument", "server", "lab_equipment", "other"],
      default: "instrument",
    },
    department: {
      type: String,
      trim: true,
      required: [true, "Department is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "in_use", "maintenance", "disabled"],
      default: "available",
    },
    maintenancePeriods: [
      {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        reason: { type: String, trim: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],

    availability: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          trim: true,
        }, // e.g. "Monday"
        // changed from Date to String to represent time-of-day (HH:mm)
        startTime: { type: String, trim: true }, // e.g. "09:00"
        endTime: { type: String, trim: true }, // e.g. "17:00"
      },
    ],
    maxBookingDuration: {
      type: Number, // in hours
      default: 2,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    usageRules: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        type: String, // URLs or local paths
        trim: true,
      },
    ],
    capacity: {
      type: Number,
      default: 1,
      min: [1, "Capacity must be at least 1"],
    },
  },
  { timestamps: true }
);

// Set default availability after schema declaration to avoid repeating schema definition
resourceSchema.path("availability").default(function () {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days.map((day) => ({ day, startTime: "09:00", endTime: "17:00" }));
});

// Indexes for fast lookup and search
resourceSchema.index({
  name: "text",
  type: "text",
  location: "text",
});

export const Resource = mongoose.model("Resource", resourceSchema);
