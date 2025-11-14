// src/utils/dateUtils.js

import dayjs from "dayjs";

/**
 * Human readable generic date (IST automatically due to default timezone)
 */
export const humanDate = (iso) =>
  iso ? dayjs(iso).format("DD MMM YYYY, h:mm A") : "N/A";

/**
 * Build upcoming N days for UI calendar
 */
export function buildUpcomingDays(count = 14) {
  const today = dayjs();
  return Array.from({ length: count }, (_, i) => {
    const d = today.add(i, "day");
    return {
      key: d.format("YYYY-MM-DD"),
      label: d.format("ddd, DD MMM"),
      isToday: i === 0,
    };
  });
}

/**
 * Extract unique IST HH:mm times from slotKeys
 */
export function extractIstTimes(schedule) {
  const set = new Set();
  for (const slotKey of Object.keys(schedule)) {
    const [, time] = slotKey.split("_");
    set.add(time);
  }
  return [...set].sort();
}

/**
 * Format day label for column header
 */
export function formatDayHeader(date) {
  return dayjs(date).format("ddd, DD MMM");
}

/**
 * Format hour labels for timeslot grid
 * Now accepts HH:mm instead of HH
 */
export function formatTimeLabel(timeStr) {
  return timeStr; // "09:00", "09:30"
}

/**
 * Build timeSlots from extracted unique times.
 * schedule must already provide HH:mm times.
 */
export function buildTimeSlotsFromSchedule(schedule) {
  return extractIstTimes(schedule).map((t) => ({ time: t, label: t }));
}

/**
 * Merge contiguous blocks (using UTC ISO keys)
 */
export function mergeBlocks(schedule) {
  const sorted = Object.keys(schedule).sort();
  const result = [];

  let i = 0;
  while (i < sorted.length) {
    let start = sorted[i];
    let end = sorted[i];
    const entry = schedule[start];
    let j = i + 1;

    while (j < sorted.length) {
      const prev = dayjs.utc(end);
      const next = dayjs.utc(sorted[j]);

      const diff = next.diff(prev, "hour");
      if (diff === 1 && schedule[sorted[j]].status === entry.status) {
        end = sorted[j];
        j++;
      } else break;
    }

    result.push({ start, end, entry });
    i = j;
  }

  return result;
}

/**
 * Format booking range for UI (IST input)
 * Input: startIsoUtc, endIsoUtc
 * Output: { startDate, endDate, startTime, endTime, isSameDay }
 *
 * NOTE: This assumes timestamps are already converted to IST before use.
 */
export function formatBookingRange(startIsoUtc, endIsoUtc) {
  const s = dayjs(startIsoUtc).tz("Asia/Kolkata");
  const e = dayjs(endIsoUtc).tz("Asia/Kolkata");

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
 * Time-ago helper
 */
export function timeAgo(dateInput) {
  const now = new Date();
  const date = new Date(dateInput);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return `${diff}s ago`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w ago`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon}mo ago`;
  const year = Math.floor(day / 365);
  return `${year}y ago`;
}
