import { Request } from "../models/request.model.js";
import { Resource } from "../models/resource.model.js";

// export const getScheduleForResource = async (req, res) => {
//   try {
//     const resourceId = req.params.id;
//     const today = new Date();
//     const twoWeeksLater = new Date();
//     twoWeeksLater.setDate(today.getDate() + 14);

//     // Get the resource details
//     const resource = await Resource.findById(resourceId);
//     if (!resource) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Resource not found" });
//     }

//     // Get all approved bookings for this resource in next 14 days
//     const bookings = await Request.find({
//       resourceId,
//       status: "approved",
//       endTime: { $gte: today },
//       startTime: { $lte: twoWeeksLater },
//     })
//       .select("startTime endTime status userId")
//       .populate("userId", "username email")
//       .populate("resourceId", "name type location isActive");

//     // Calculate free slots between bookings for the given window
//     // Assuming resource availability from 8 AM to 8 PM daily for example
//     const availabilityStartHour = 8;
//     const availabilityEndHour = 20;

//     const freeSlots = [];

//     // Helper to add a free slot if at least 15 minutes (900000 ms) gap
//     const minSlotDuration = 15 * 60 * 1000;

//     // Generate daily free slots by going through each day in the range
//     for (
//       let day = new Date(today);
//       day <= twoWeeksLater;
//       day.setDate(day.getDate() + 1)
//     ) {
//       let dailyStart = new Date(day);
//       dailyStart.setHours(availabilityStartHour, 0, 0, 0);
//       let dailyEnd = new Date(day);
//       dailyEnd.setHours(availabilityEndHour, 0, 0, 0);

//       // Filter bookings for this day and sort by startTime
//       const dailyBookings = bookings
//         .filter((b) => b.startTime >= dailyStart && b.startTime < dailyEnd)
//         .sort((a, b) => a.startTime - b.startTime);

//       let cursor = dailyStart;
//       for (const bk of dailyBookings) {
//         if (bk.startTime > cursor) {
//           const gap = bk.startTime.getTime() - cursor.getTime();
//           if (gap >= minSlotDuration) {
//             freeSlots.push({
//               startTime: new Date(cursor),
//               endTime: new Date(bk.startTime),
//             });
//           }
//         }
//         // Move cursor forward
//         cursor = bk.endTime > cursor ? bk.endTime : cursor;
//       }
//       // Check for free slot after last booking till end of day
//       if (cursor < dailyEnd) {
//         const gap = dailyEnd.getTime() - cursor.getTime();
//         if (gap >= minSlotDuration) {
//           freeSlots.push({
//             startTime: new Date(cursor),
//             endTime: new Date(dailyEnd),
//           });
//         }
//       }
//     }

//     res.status(200).json({
//       success: true,
//       statusCode: 200,
//       count: bookings.length,
//       resource: resource.toObject(),
//       bookedSlots: bookings,
//       freeSlots,
//       message: "Schedule and free slots fetched for next 14 days",
//     });
//   } catch (error) {
//     console.error("Error fetching schedule:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

export const getUserSchedule = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user's ID
    const now = new Date();

    // Find all approved bookings for this user with startTime in the future
    const bookings = await Request.find({
      userId,
      status: "approved",
      startTime: { $gte: now },
    })
      .populate("resourceId", "name type location description") // Include resource details
      .sort({ startTime: 1 }); // Sort by upcoming start time ascending

    res.status(200).json({
      success: true,
      statusCode: 200,
      count: bookings.length,
      bookings,
      message: "User upcoming bookings fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getScheduleForResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    // Get the resource details
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    // Get all approved bookings for this resource in next 14 days
    const bookings = await Request.find({
      resourceId,
      status: "approved",
      endTime: { $gte: today },
      startTime: { $lte: twoWeeksLater },
    })
      .select("startTime endTime status userId purpose")
      .populate("userId", "username email")
      .lean();

    // Build pre-computed grid data
    const gridData = buildScheduleGrid(bookings, resource.availability, today, twoWeeksLater);

    res.status(200).json({
      success: true,
      statusCode: 200,
      count: bookings.length,
      resource: resource.toObject(),
      schedule: gridData,
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

// Helper function to build the grid
function buildScheduleGrid(bookings, availability, startDate, endDate) {
  // Find min/max hours from availability
  let minHour = 24;
  let maxHour = 0;
  
  availability.forEach(avail => {
    const [startH] = avail.startTime.split(':').map(Number);
    const [endH] = avail.endTime.split(':').map(Number);
    minHour = Math.min(minHour, startH);
    maxHour = Math.max(maxHour, endH);
  });

  // Create availability lookup map (day -> hours array)
  const availabilityMap = {};
  availability.forEach(avail => {
    const [startH] = avail.startTime.split(':').map(Number);
    const [endH] = avail.endTime.split(':').map(Number);
    availabilityMap[avail.day.toLowerCase()] = { startH, endH };
  });

  // Create booked slots map with booking details
  const bookedSlots = {};
  bookings.forEach(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    
    // Mark all hours between start and end as booked
    for (let dt = new Date(start); dt < end; dt.setHours(dt.getHours() + 1)) {
      const dateKey = dt.toISOString().split('T')[0];
      const hour = dt.getHours();
      bookedSlots[`${dateKey}_${hour}`] = {
        purpose: booking.purpose,
        user: booking.userId?.username || 'Unknown',
        startTime: booking.startTime,
        endTime: booking.endTime
      };
    }
  });

  // Create unavailable slots map (outside availability)
  const unavailableSlots = {};
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
    const dateKey = dt.toISOString().split('T')[0];
    const dayName = dayNames[dt.getDay()];
    const dayAvail = availabilityMap[dayName];
    
    if (!dayAvail) {
      // No availability this day - mark all hours unavailable
      for (let h = minHour; h < maxHour; h++) {
        unavailableSlots[`${dateKey}_${h}`] = true;
      }
    } else {
      // Mark hours outside availability
      for (let h = minHour; h < maxHour; h++) {
        if (h < dayAvail.startH || h >= dayAvail.endH) {
          unavailableSlots[`${dateKey}_${h}`] = true;
        }
      }
    }
  }

  return {
    timeRange: { startHour: minHour, endHour: maxHour },
    bookedSlots,      // Changed from bookedCells
    unavailableSlots, // Changed from unavailableCells
  };
}
