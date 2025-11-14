// utils/timezone.util.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const IST = "Asia/Kolkata";

/**
 * Ensure HH or HH:mm has padded format
 */
export function pad(num) {
  return num.toString().padStart(2, "0");
}

/**
 * Convert IST HH:mm on a given date → dayjs UTC datetime
 * Example:
 *   dateObj = 2025-11-15
 *   "09:00" IST → "2025-11-15T03:30:00.000Z"
 */
export function istTimeToUtc(dateObj, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);

  // Create IST datetime for that specific date
  const istDate = dayjs(dateObj)
    .tz(IST)
    .hour(h)
    .minute(m)
    .second(0)
    .millisecond(0);

  return istDate.utc(); // Converted to UTC
}

/**
 * Convert a dayjs or Date object to an ISO string aligned to UTC with minutes preserved.
 */
export function toIsoExactUTC(dateObj) {
  return dayjs(dateObj)
    .utc()
    .second(0)
    .millisecond(0)
    .toISOString();
}

/**
 * Convert an ISO (UTC) string → IST ISO
 */
export function utcToIst(isoString) {
  return dayjs.utc(isoString).tz(IST).format();
}

/**
 * Convert an IST ISO string → UTC ISO
 */
export function istToUtc(isoString) {
  return dayjs.tz(isoString, IST).utc().format();
}

/**
 * Add N hours to a UTC-based slot (exact stepping)
 */
export function addUtcHours(isoString, hours = 1) {
  return dayjs.utc(isoString).add(hours, "hour");
}

export default {
  istTimeToUtc,
  toIsoExactUTC,
  utcToIst,
  istToUtc,
  addUtcHours,
  pad,
};
