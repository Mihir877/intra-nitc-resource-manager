import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    purpose: {
      type: String,
      trim: true,
      required: [true, "Purpose of booking is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for faster conflict checking and lookups
requestSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });

export const Request = mongoose.model("Request", requestSchema);
