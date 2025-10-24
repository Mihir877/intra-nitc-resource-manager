// app/utils/scheduleHelpers.js
export const toISODate = (d) => d.toISOString().slice(0, 10);
export const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
export const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const addMinutes = (d, m) => new Date(d.getTime() + m * 60 * 1000);
export const isBefore = (a, b) => a.getTime() < b.getTime();
export const isAfterOrEqual = (a, b) => a.getTime() >= b.getTime();

export const clampTo14Days = (base) => ({
  from: startOfDay(base),
  to: endOfDay(addDays(base, 13)),
});

export const formatDayShort = (d) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

export const formatTime = (d) =>
  d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export const useTwoWeekDays = (
  today,
  addDaysFn,
  toISODateFn,
  formatDayShortFn
) =>
  Array.from({ length: 14 }, (_, i) => {
    const date = addDaysFn(today, i);
    return { key: toISODateFn(date), date, label: formatDayShortFn(date) };
  });

export const useTimeSlots = (slotMinutes, fromHour, toHour) =>
  Array.from({ length: (toHour - fromHour) * (60 / slotMinutes) }, (_, i) => {
    const h = Math.floor((i * slotMinutes) / 60) + fromHour;
    const m = (i * slotMinutes) % 60;
    return {
      h,
      m,
      label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    };
  });

export const indexBookingsByDay = (items, windowFrom, windowTo, utils) => {
  const arr = Array.isArray(items?.items)
    ? items.items
    : Array.isArray(items)
    ? items
    : [];
  const map = new Map();
  for (const b of arr) {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    if (utils.isBefore(end, new Date())) continue;
    if (
      utils.isAfterOrEqual(start, utils.addDays(windowTo, 1)) ||
      utils.isBefore(end, windowFrom)
    )
      continue;
    const dayStart = utils.startOfDay(start);
    for (
      let d = new Date(dayStart);
      !utils.isAfterOrEqual(d, utils.addDays(utils.endOfDay(end), 1));
      d = utils.addDays(d, 1)
    ) {
      const key = utils.toISODate(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({
        start,
        end,
        status: b.status,
        id: b.id ?? `${b.startTime}-${b.endTime}-${b.status}`,
        title: b.title ?? "Booked",
      });
    }
  }
  return map;
};

export const cellBooked = (bookingsForDay, cellStart, cellEnd) =>
  bookingsForDay?.find((b) => b.start < cellEnd && b.end > cellStart) ?? null;
