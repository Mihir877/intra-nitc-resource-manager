// src/utils/timezone.js

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const IST = "Asia/Kolkata";

/**
 * Convert backend UTC ISO → IST slotKey
 * Example:
 *   2025-11-17T03:30:00.000Z → "2025-11-17_09:00"
 */
export function isoUtcToSlotKey(isoUtc) {
  const ist = dayjs.utc(isoUtc).tz(IST);
  return `${ist.format("YYYY-MM-DD")}_${ist.format("HH:mm")}`;
}

/**
 * Convert IST slotKey (YYYY-MM-DD_HH:mm) → precise UTC ISO
 */
export function slotKeyToUtcIso(slotKey) {
  const [date, time] = slotKey.split("_");
  return dayjs.tz(`${date} ${time}`, IST).utc().toISOString();
}

/**
 * Convert UTC ISO → IST dayjs
 */
export function utcToIst(isoUtc) {
  return dayjs.utc(isoUtc).tz(IST);
}

/**
 * IST Y-M-D HH:mm → UTC ISO
 */
export function istToUtcIso(date, hhmm) {
  return dayjs.tz(`${date} ${hhmm}`, IST).utc().toISOString();
}

/**
 * Convert UTC ISO → "HH:mm" IST label
 */
export function utcIsoToIstLabel(isoUtc) {
  return utcToIst(isoUtc).format("HH:mm");
}

/**
 * Add exactly 1 hour to IST slotKey (preserving :00 or :30)
 */
export function addOneHourSlotKey(slotKey) {
  const [date, time] = slotKey.split("_");
  const dt = dayjs.tz(`${date} ${time}`, IST).add(1, "hour");
  return `${dt.format("YYYY-MM-DD")}_${dt.format("HH:mm")}`;
}

/**
 * Generate UTC hourly stepping (03:30 → 04:30 → …)
 */
export function generateUtcSteps(startUtcIso, endUtcIso) {
  const list = [];
  let cursor = dayjs.utc(startUtcIso);
  const end = dayjs.utc(endUtcIso);

  while (cursor.isBefore(end)) {
    list.push(cursor.toISOString());
    cursor = cursor.add(1, "hour");
  }
  return list;
}

export default {
  isoUtcToSlotKey,
  slotKeyToUtcIso,
  utcToIst,
  istToUtcIso,
  utcIsoToIstLabel,
  addOneHourSlotKey,
  generateUtcSteps,
};
