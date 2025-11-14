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

// Helper
function toIsoHour(date) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}
``;
// GET: 14-day schedule for a resource as ISO-hour keyed map
export const getScheduleForResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 14);

    const resource = await Resource.findById(resourceId).lean();
    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    const requests = await Request.find({
      resourceId,
      endTime: { $gte: startDate },
      startTime: { $lte: endDate },
      status: { $in: ["approved", "pending"] },
    })
      .select("startTime endTime status userId purpose")
      .populate("userId", "username email")
      .lean();

    const { schedule, timeRange } = buildIsoHourSchedule({
      requests,
      availability: resource.availability || [],
      windowStart: startDate,
      windowEnd: endDate,
      currentUserId: req.user?._id?.toString?.() || null,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      resource,
      schedule, // { [isoHour]: { status, user, purpose, isStartSlot, isEndSlot, isRequestable } }
      timeRange, // { startHour, endHour }
      message: "Schedule fetched for next 14 days",
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Helpers

function isoHourKey(d) {
  const x = new Date(d);
  x.setUTCMinutes(0, 0, 0);
  return x.toISOString();
}

function startOfDayUtc(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/**
 * Build UTC-keyed hourly schedule for 14 days.
 * Availability in IST → converted EXACTLY to UTC (ex: 09:00 IST → 03:30 UTC)
 */
export function buildIsoHourSchedule({
  requests,
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

  // Map availability by day name
  const availMap = {}; // { monday: { startIst, endIst }, ... }
  availability.forEach((a) => {
    availMap[a.day.toLowerCase()] = {
      startIst: a.startTime,
      endIst: a.endTime,
    };
  });

  const schedule = {};

  // Iterate across all days in the window
  for (
    let d = dayjs(windowStart).startOf("day");
    d.isBefore(windowEnd);
    d = d.add(1, "day")
  ) {
    const dayName = dayNames[d.utc().day()];
    const avail = availMap[dayName];

    if (!avail) continue;

    // Convert IST availability → exact UTC times
    const startUtc = istTimeToUtc(d, avail.startIst); // exact minutes included
    const endUtc = istTimeToUtc(d, avail.endIst);

    // Generate hourly stepping: 03:30 → 04:30 → 05:30 → etc.
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

  // Apply bookings (pending + approved)
  for (const r of requests) {
    const start = dayjs(r.startTime).utc();
    const end = dayjs(r.endTime).utc();

    // Normalize stepping: exact hour stepping from real start
    let cursor = start.clone();

    while (cursor.isBefore(end)) {
      const key = cursor.toISOString();

      // skip if slot is not in availability map
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
    timeRange: { startHour: null, endHour: null }, // not needed anymore
  };
}
