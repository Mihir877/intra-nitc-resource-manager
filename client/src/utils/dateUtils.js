// src/utils/dateUtils.js
// Centralized date/time utilities for schedule UI.
// Uses dayjs with UTC to avoid local timezone drift when working with ISO strings.

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

// optional: set globally if the app only runs in India
dayjs.tz.setDefault("Asia/Kolkata");

export const humanDate = (iso) =>
  iso ? dayjs(iso).tz().format("DD MMM YYYY, h:mm A") : "N/A";

/**
 * parseSlotKeyToIso
 * Input: slotKey: string in "YYYY-MM-DD_HH" (24h) format (e.g., "2025-11-07_08")
 * Output: ISO string at exact UTC hour "YYYY-MM-DDTHH:00:00.000Z"
 */
export function parseSlotKeyToIso(slotKey) {
  const [dayKey, hour] = slotKey.split("_");
  return `${dayKey}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

/**
 * isoToSlotKey
 * Input: iso: ISO string representing a UTC time (e.g., "2025-11-07T08:00:00.000Z")
 * Output: slotKey string "YYYY-MM-DD_HH" in UTC
 */
export function isoToSlotKey(iso) {
  const d = dayjs(iso).utc();
  return `${d.format("YYYY-MM-DD")}_${d.format("HH")}`;
}

/**
 * addHoursIso
 * Input: iso: ISO string (UTC), hours: integer (can be negative)
 * Output: ISO string advanced by given hours in UTC
 */
export function addHoursIso(iso, hours) {
  return dayjs(iso).utc().add(hours, "hour").toISOString();
}

/**
 * sameHourConsecutive
 * Input:
 *   prevIso: ISO string (UTC)
 *   nextIso: ISO string (UTC)
 * Output: boolean — true if nextIso is exactly prevIso + 1 hour (contiguous slot)
 */
export function sameHourConsecutive(prevIso, nextIso) {
  const expectedNext = dayjs(prevIso).utc().add(1, "hour").toISOString();
  return nextIso === expectedNext;
}

/**
 * formatHourLabel
 * Input: hour: number (0–23)
 * Output: string label "HH:00" (e.g., 8 -> "08:00")
 */
export function formatHourLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * formatDayHeader
 * Input: date: Date (local) or ISO string
 * Output: string like "Fri, 07 Nov" (locale-aware via dayjs formatting)
 */
export function formatDayHeader(date) {
  const d = typeof date === "string" ? dayjs(date) : dayjs(date);
  return d.format("ddd, DD MMM");
}

/**
 * getBookingTimeInfo
 *
 * Input:
 *   startIso: ISO string (UTC) for the first slot of a block
 *   endIso:   ISO string (UTC) for the last slot of a block
 *
 * Behavior:
 *   - Computes start and end times for a booking block.
 *   - End time is (last slot + 1 hour), matching 1-hour slot semantics.
 *   - Provides structured fields for UI components.
 *
 * Returns:
 *   {
 *     startDate: "Wed, Nov 4",
 *     endDate:   "Wed, Nov 4",
 *     isSameDay: true/false,
 *     startTime: "08:00",
 *     endTime:   "10:00"
 *   }
 */
export function getBookingTimeInfo(start, end) {
  const s = dayjs(start).tz("Asia/Kolkata");
  const e = dayjs(end).tz("Asia/Kolkata");

  const isSameDay = s.isSame(e, "day");

  return {
    isSameDay,
    startDate: s.format("DD MMM YYYY"),
    endDate: e.format("DD MMM YYYY"),
    startTime: s.format("hh:mm A"),
    endTime: e.format("hh:mm A"),
  };
}

/**
 * buildUpcomingDays
 * Input: count: number of days (default 14), start: Date = today (local)
 * Output: Array<{ key: string(YYYY-MM-DD), label: string("Fri, 07 Nov" short), isToday: boolean }>
 */
export function buildUpcomingDays(count = 14, start = new Date()) {
  const today = new Date(start);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const key = date.toISOString().split("T")[0];
    const label = date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const isToday = i === 0;
    return { key, label, isToday };
  });
}

/**
 * clampViewHours
 * Input:
 *   apiStart: number (0–23) — API window start hour
 *   apiEnd: number (1–24) — API window end hour (exclusive)
 *   viewStart: number — desired start hour
 *   viewEnd: number — desired end hour (exclusive)
 * Output: { safeStart: number, safeEnd: number } with clamped and normalized bounds
 */
export function clampViewHours(apiStart, apiEnd, viewStart, viewEnd) {
  const startHour = Math.max(apiStart ?? 0, viewStart);
  const endHour = Math.min(apiEnd ?? 24, viewEnd);
  const safeStart = Math.min(startHour, endHour);
  const safeEnd = Math.max(endHour, startHour);
  return { safeStart, safeEnd };
}

/**
 * buildTimeSlots
 * Input:
 *   safeStart: number — inclusive hour
 *   safeEnd: number — exclusive hour
 * Output: Array<{ h: number, label: string("HH:00") }>
 */
export function buildTimeSlots(safeStart, safeEnd) {
  return Array.from({ length: safeEnd - safeStart }, (_, i) => {
    const h = safeStart + i;
    return { h, label: formatHourLabel(h) };
  });
}

/**
 * coalesceContiguousBlocks
 * Input:
 *   schedule: Record<ISO string, { status: string, purpose?: string }>
 * Behavior: sorts by ISO, merges adjacent 1-hour entries if same status and purpose
 * Output: Array<{ start: ISO, end: ISO, entry: object }>
 */
export function coalesceContiguousBlocks(schedule) {
  const entries = Object.entries(schedule).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const result = [];
  let i = 0;
  while (i < entries.length) {
    const [iso, e] = entries[i];
    if (!e || e.status === "unavailable" || e.status === "available") {
      i++;
      continue;
    }
    let startIso = iso;
    let endIso = iso;
    let j = i + 1;
    while (j < entries.length) {
      const [nextIso, nextE] = entries[j];
      if (
        nextE &&
        sameHourConsecutive(endIso, nextIso) &&
        nextE.status === e.status &&
        nextE.purpose === e.purpose
      ) {
        endIso = nextIso;
        j++;
      } else break;
    }
    result.push({ start: startIso, end: endIso, entry: e });
    i = j;
  }
  return result;
}

export function timeAgo(dateInput) {
  const now = new Date();
  const date = new Date(dateInput);
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60) return `${diff} second${diff === 1 ? "" : "s"} ago`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk} week${wk === 1 ? "" : "s"} ago`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon} month${mon === 1 ? "" : "s"} ago`;
  const yr = Math.floor(day / 365);
  return `${yr} year${yr === 1 ? "" : "s"} ago`;
}
