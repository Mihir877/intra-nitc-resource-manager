import dayjs from "dayjs";
import { Request } from "../models/request.model.js";
import { Resource } from "../models/resource.model.js";
import {
  istTimeToUtc,
  toIsoExactUTC,
  addUtcHours,
} from "../utils/timezone.util.js";

/**
 * @desc Get 14-day user booking schedule (IN PURE UTC — absolute)
 * @route GET /api/v1/schedule/user
 */
export const getUserSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    // 14-day window in UTC
    const windowStart = dayjs().utc().startOf("day");
    const windowEnd = windowStart.add(14, "day");

    // Fetch bookings (already in UTC in DB)
    const requests = await Request.find({
      userId,
      endTime: { $gte: windowStart.toDate() },
      startTime: { $lte: windowEnd.toDate() },
      status: { $in: ["approved", "pending"] },
    })
      .select("startTime endTime status resourceId purpose")
      .populate("resourceId", "name location type description")
      .lean();

    const schedule = {};

    for (const r of requests) {
      const startUtc = dayjs.utc(r.startTime);
      const endUtc = dayjs.utc(r.endTime);

      // exact hourly stepping: 03:30 → 04:30 → …
      let cursor = startUtc.clone();

      while (cursor.isBefore(endUtc)) {
        const isoKey = toIsoExactUTC(cursor);

        schedule[isoKey] = {
          status: r.status === "approved" ? "booked" : "pendingMine",
          resource: r.resourceId?.name || "Resource",
          location: r.resourceId?.location || "",
          type: r.resourceId?.type || "",
          purpose: r.purpose || "",
          // detect boundaries
          isStartSlot: cursor.isSame(startUtc),
          isEndSlot: cursor.add(1, "hour").isSame(endUtc),
        };

        cursor = cursor.add(1, "hour");
      }
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      schedule,
      message: "User schedule fetched successfully (UTC precise)",
    });
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// GET: 14-day schedule for a resource as ISO-hour keyed map

export const getScheduleForResource = async (req, res) => {
  try {
    const resourceId = req.params.id;

    // Window start → today (UTC midnight)
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    // Window end → 14 days
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 14);

    // Fetch resource
    const resource = await Resource.findById(resourceId).lean();
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Inactive? Don't send schedule
    if (!resource.isActive) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        resource,
        isActive: false,
        schedule: null,
        timeRange: null,
        message: "Resource is inactive. Schedule disabled.",
      });
    }

    // Extract maintenance periods ONLY inside schedule window
    const maintenancePeriods = (resource.maintenancePeriods || []).filter(
      (p) => {
        const start = new Date(p.start);
        const end = new Date(p.end);
        return end >= startDate && start <= endDate; // overlapping
      }
    );

    // Fetch requests (approved + pending)
    const requests = await Request.find({
      resourceId,
      endTime: { $gte: startDate },
      startTime: { $lte: endDate },
      status: { $in: ["approved", "pending"] },
    })
      .select("startTime endTime status userId purpose")
      .populate("userId", "username email")
      .lean();

    // Build schedule (with maintenance overlay)
    const { schedule, timeRange } = buildIsoHourSchedule({
      requests,
      maintenancePeriods,
      availability: resource.availability || [],
      windowStart: startDate,
      windowEnd: endDate,
      currentUserId: req.user?._id?.toString?.() || null,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      resource,
      isActive: true,
      schedule,
      timeRange,
      message: "Schedule fetched for next 14 days",
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ==================== BUILD SCHEDULE (with maintenance overlay) ====================

export function buildIsoHourSchedule({
  requests,
  maintenancePeriods = [],
  availability,
  windowStart,
  windowEnd,
  currentUserId,
}) {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  // Build availability map (IST strings)
  const availMap = {};
  availability.forEach((a) => {
    availMap[a.day.toLowerCase()] = {
      startIst: a.startTime,
      endIst: a.endTime,
    };
  });

  const schedule = {};

  // 1) Generate AVAILABLE slots
  for (
    let d = dayjs(windowStart).startOf("day");
    d.isBefore(windowEnd);
    d = d.add(1, "day")
  ) {
    const dayName = dayNames[d.utc().day()];
    const avail = availMap[dayName];
    if (!avail) continue;

    const startUtc = istTimeToUtc(d, avail.startIst);
    const endUtc = istTimeToUtc(d, avail.endIst);

    let cursor = startUtc.clone();
    while (cursor.isBefore(endUtc)) {
      const isoKey = toIsoExactUTC(cursor);

      schedule[isoKey] = {
        status: "available",
        user: "",
        purpose: "",
        isStartSlot: false,
        isEndSlot: false,
        isRequestable: true,
      };

      cursor = cursor.add(1, "hour");
    }
  }

  // 2) Apply MAINTENANCE periods (same shape as booking)
  for (const p of maintenancePeriods) {
    const start = dayjs(p.start).utc();
    const end = dayjs(p.end).utc();

    let cursor = start.clone();

    while (cursor.isBefore(end)) {
      const key = cursor.toISOString();

      if (schedule[key]) {
        schedule[key] = {
          status: "maintenance",
          user: "",
          purpose: p.reason || "Maintenance",
          isStartSlot: cursor.isSame(start),
          isEndSlot: cursor.add(1, "hour").isSame(end),
          isRequestable: false,
        };
      }

      cursor = cursor.add(1, "hour");
    }
  }

  // 3) Apply BOOKINGS (pending + approved)
  for (const r of requests) {
    const start = dayjs(r.startTime).utc();
    const end = dayjs(r.endTime).utc();
    let cursor = start.clone();

    while (cursor.isBefore(end)) {
      const key = cursor.toISOString();

      if (!schedule[key]) {
        cursor = cursor.add(1, "hour");
        continue;
      }

      const owner =
        typeof r.userId === "object" ? r.userId?._id?.toString() : r.userId;

      const isSelf = currentUserId && owner === currentUserId;

      if (r.status === "approved") {
        schedule[key] = {
          status: "booked",
          user:
            typeof r.userId === "object"
              ? r.userId.username || "Booked"
              : "Booked",
          purpose: r.purpose || "",
          isStartSlot: cursor.isSame(start),
          isEndSlot: cursor.add(1, "hour").isSame(end),
          isRequestable: false,
        };
      } else if (r.status === "pending") {
        const status = isSelf ? "pendingMine" : "pendingOther";

        schedule[key] = {
          status,
          user: isSelf ? "You" : "",
          purpose: isSelf ? r.purpose || "" : "",
          isStartSlot: cursor.isSame(start),
          isEndSlot: cursor.add(1, "hour").isSame(end),
          isRequestable: !isSelf && schedule[key].status === "available",
        };
      }

      cursor = cursor.add(1, "hour");
    }
  }

  return {
    schedule,
    timeRange: { startHour: null, endHour: null },
  };
}
