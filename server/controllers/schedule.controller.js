import { Request } from "../models/request.model.js";
import { Resource } from "../models/resource.model.js";

/**
 * @desc    Get 14-day user booking schedule (ISO-hour map like getScheduleForResource)
 * @route   GET /api/v1/schedule/user
 * @access  Authenticated User
 */
export const getUserSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    // Define the 14-day window
    const windowStart = new Date();
    windowStart.setUTCHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 14);

    // Fetch user’s approved and pending bookings
    const requests = await Request.find({
      userId,
      endTime: { $gte: windowStart },
      startTime: { $lte: windowEnd },
      status: { $in: ["approved", "pending"] },
    })
      .select("startTime endTime status resourceId purpose")
      .populate("resourceId", "name location type description")
      .lean();

    // Build the hourly schedule map
    const schedule = {};
    const timeRange = { startHour: 0, endHour: 24 }; // full day coverage

    for (const r of requests) {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);

      const cursor = new Date(start);
      cursor.setUTCMinutes(0, 0, 0);

      const hourKeys = [];
      while (cursor < end) {
        const key = toIsoHour(cursor);
        hourKeys.push(key);
        cursor.setUTCHours(cursor.getUTCHours() + 1);
      }

      for (let i = 0; i < hourKeys.length; i++) {
        const key = hourKeys[i];
        schedule[key] = {
          status: r.status === "approved" ? "booked" : "pendingMine",
          resource: r.resourceId?.name || "Resource",
          location: r.resourceId?.location || "",
          type: r.resourceId?.type || "",
          purpose: r.purpose || "",
          isStartSlot: i === 0,
          isEndSlot: i === hourKeys.length - 1,
        };
      }
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      schedule, // ISO-hour keyed map
      timeRange, // consistent with getScheduleForResource
      message: "User 14-day booking schedule fetched successfully",
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
``
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

function buildIsoHourSchedule({
  requests,
  availability,
  windowStart,
  windowEnd,
  currentUserId,
}) {
  // Determine min/max working hours across the week
  let minHour = 24;
  let maxHour = 0;
  const dayAvailMap = {}; // sunday..saturday -> { startH, endH }
  availability.forEach((a) => {
    const [sH] = a.startTime.split(":").map(Number);
    const [eH] = a.endTime.split(":").map(Number);
    minHour = Math.min(minHour, sH);
    maxHour = Math.max(maxHour, eH);
    dayAvailMap[a.day.toLowerCase()] = { startH: sH, endH: eH };
  });
  if (minHour === 24) {
    minHour = 0;
    maxHour = 24;
  }

  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const schedule = {}; // isoHour -> entry
  // Initialize by availability
  for (
    let day = new Date(windowStart);
    day < windowEnd;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const dayName = dayNames[day.getUTCDay()];
    const avail = dayAvailMap[dayName];
    for (let h = minHour; h < maxHour; h++) {
      const slot = new Date(day);
      slot.setUTCHours(h, 0, 0, 0);
      const key = isoHourKey(slot);
      const inside = !!(avail && h >= avail.startH && h < avail.endH);
      schedule[key] = {
        status: inside ? "available" : "unavailable",
        user: "",
        purpose: "",
        isStartSlot: false,
        isEndSlot: false,
        isRequestable: inside, // may be overridden by bookings/holds
      };
    }
  }

  // Paint bookings and pendings across hours
  for (const r of requests) {
    const start = new Date(r.startTime);
    const end = new Date(r.endTime);
    // normalize to hour increments
    const cursor = new Date(start);
    cursor.setUTCMinutes(0, 0, 0);

    const hoursKeys = [];
    while (cursor < end) {
      const key = isoHourKey(cursor);
      hoursKeys.push(key);
      cursor.setUTCHours(cursor.getUTCHours() + 1);
    }

    if (!hoursKeys.length) continue;

    const owner =
      typeof r.userId === "object" ? r.userId?._id?.toString?.() : r.userId;
    const isSelf = currentUserId && owner === currentUserId;

    for (let i = 0; i < hoursKeys.length; i++) {
      const key = hoursKeys[i];
      if (!schedule[key]) continue; // outside availability window hours

      if (r.status === "approved") {
        schedule[key] = {
          status: "booked",
          user:
            (typeof r.userId === "object" && r.userId?.username) || "Booked",
          purpose: r.purpose || "",
          isStartSlot: i === 0,
          isEndSlot: i === hoursKeys.length - 1,
          isRequestable: false,
        };
      } else if (r.status === "pending") {
        const owner =
          typeof r.userId === "object" ? r.userId?._id?.toString?.() : r.userId;
        const isSelf = currentUserId && owner === currentUserId;
        const displayStatus = isSelf ? "pendingMine" : "pendingOther";
        const userName = isSelf
          ? (typeof r.userId === "object" && r.userId?.username) || "You"
          : "";

        if (schedule[key].status !== "booked") {
          const wasAvailable = schedule[key].status === "available";

          schedule[key] = {
            status: displayStatus,
            user: userName,
            purpose: isSelf ? r.purpose || "" : "",
            isStartSlot: i === 0,
            isEndSlot: i === hoursKeys.length - 1,
            // own pending never requestable; others’ pending only if slot was free
            isRequestable: isSelf ? false : wasAvailable,
          };
        }
      }
    }
  }

  // If you have maintenance/holds, add them here as softBlocked/cooldown.
  // Example stub (disabled by default):
  // const maintenanceIso = "2025-11-05T10:00:00.000Z";
  // if (schedule[maintenanceIso]) {
  //   schedule[maintenanceIso] = { ...schedule[maintenanceIso], status: "softBlocked", isRequestable: false };
  // }

  return {
    schedule,
    timeRange: { startHour: minHour, endHour: maxHour },
  };
}
