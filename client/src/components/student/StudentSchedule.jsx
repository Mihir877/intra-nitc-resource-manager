// app/components/user/UserSchedule.jsx

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import api from "@/api/axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Filter, Check, MapPin, Box, FileText, CircleDot } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import PageTitle from "../common/PageTitle";
import { useMediaQuery } from "@react-hookz/web";

// timezone & date utils (same as your project)
import { isoUtcToSlotKey, utcToIst } from "@/utils/timezone";
import { buildUpcomingDays } from "@/utils/dateUtils";

import dayjs from "dayjs";

/* --------------------------
   Booking status styles
   -------------------------- */
const BOOKING_STATUS = {
  available: {
    style:
      "bg-white border-green-500/20 text-gray-600 hover:bg-green-50 dark:bg-gray-900 dark:border-green-900/80 dark:text-gray-300",
    label: "",
  },
  booked: {
    style:
      "bg-green-300/60 border-green-700/80 font-semibold text-green-900/90 dark:bg-green-950/80 dark:text-green-300/90 dark:border-green-500/60",
    label: "Booked",
  },
  pendingMine: {
    style:
      "bg-amber-300/60 border-amber-600 font-semibold text-amber-900/90 dark:bg-amber-950/90 dark:text-amber-300/90 dark:border-amber-500/60",
    label: "Pending",
  },

  rejected: {
    style:
      "bg-red-50 border-red-200 text-red-300/90 font-semibold dark:bg-red-950/80 dark:border-red-500/70",
    label: "Rejected",
  },
  unavailable: {
    style:
      "bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-gray-800 text-gray-500",
    label: "",
  },
};

/* -----------------------------------------
   compute dynamic time window (IST) from UTC schedule
   ----------------------------------------- */
function computeDynamicTimeWindowFromBookings(originalIsoMap) {
  const DEFAULT_MIN = "09:00";
  const DEFAULT_MAX = "17:00";

  const startTimes = [];
  const endTimes = [];

  for (const isoUtc in originalIsoMap) {
    const entry = originalIsoMap[isoUtc];
    if (!entry) continue;

    if (entry.isStartSlot) {
      const ist = utcToIst(entry.startTime || isoUtc);
      startTimes.push(ist.format("HH:mm"));
    }
    if (entry.isEndSlot) {
      const ist = utcToIst(entry.endTime || isoUtc);
      endTimes.push(ist.format("HH:mm"));
    }
  }

  if (startTimes.length === 0 && endTimes.length === 0) {
    return { start: DEFAULT_MIN, end: DEFAULT_MAX };
  }

  const minTime = [...startTimes].sort()[0] ?? DEFAULT_MIN;
  const maxTime = [...endTimes].sort().reverse()[0] ?? DEFAULT_MAX;

  const start = minTime < DEFAULT_MIN ? minTime : DEFAULT_MIN;
  const end = maxTime > DEFAULT_MAX ? maxTime : DEFAULT_MAX;

  return { start, end };
}

/* -----------------------------------------
   Helpers: bookingGroupKey, buildDayBlocks, buildAgendaBlocks
   (same approach as earlier — groups contiguous slots by booking)
   ----------------------------------------- */
function bookingGroupKey(entry) {
  if (!entry) return "__empty__";
  if (entry.requestId) return `REQ:${entry.requestId}`;
  return `R:${entry.resource}||L:${entry.location}||T:${entry.type}||P:${entry.purpose}||S:${entry.status}`;
}

function buildDayBlocks(schedule, upcomingDays, times) {
  const dayBlocks = {};

  upcomingDays.forEach((d) => {
    const dayKey = d.key;
    const blocks = [];
    let cursorIdx = 0;

    while (cursorIdx < times.length) {
      const time = times[cursorIdx];
      const slotKey = `${dayKey}_${time}`;
      const entry = schedule[slotKey];

      if (!entry) {
        cursorIdx++;
        continue;
      }

      const groupKey = bookingGroupKey(entry);
      let span = 1;
      let endIdx = cursorIdx;
      let endSlotKey = slotKey;

      for (let j = cursorIdx + 1; j < times.length; j++) {
        const nextSlot = `${dayKey}_${times[j]}`;
        const nextEntry = schedule[nextSlot];

        if (!nextEntry) break;
        const nextGroup = bookingGroupKey(nextEntry);
        if (nextGroup !== groupKey) break;

        span++;
        endIdx = j;
        endSlotKey = nextSlot;
      }

      blocks.push({
        startIndex: cursorIdx,
        span,
        entry,
        groupKey,
        startSlotKey: `${dayKey}_${times[cursorIdx]}`,
        endSlotKey: endSlotKey,
      });

      cursorIdx = endIdx + 1;
    }

    dayBlocks[dayKey] = blocks;
  });

  return dayBlocks;
}

function buildAgendaBlocks(schedule, upcomingDays, times) {
  const slots = [];
  upcomingDays.forEach((d) => {
    times.forEach((t) => {
      const key = `${d.key}_${t}`;
      const entry = schedule[key];
      slots.push({
        slotKey: key,
        entry,
      });
    });
  });

  const agenda = [];
  let i = 0;
  while (i < slots.length) {
    const s = slots[i];
    if (!s.entry) {
      i++;
      continue;
    }

    const groupKey = bookingGroupKey(s.entry);
    const entry = s.entry;
    const startSlot = s.slotKey;
    let endSlot = s.slotKey;
    i++;

    while (i < slots.length) {
      const nxt = slots[i];
      if (!nxt.entry) break;
      if (bookingGroupKey(nxt.entry) !== groupKey) break;
      endSlot = nxt.slotKey;
      i++;
    }

    agenda.push({
      startSlotKey: startSlot,
      endSlotKey: endSlot,
      entry,
      groupKey,
    });
  }

  return agenda;
}

/* -----------------------------------------
   slotKey → ISO fallback (used for agenda formatting fallback)
   ----------------------------------------- */
function slotKeyToUtcIso(slotKey) {
  const [date, time] = slotKey.split("_");
  const dt = dayjs(`${date} ${time}`);
  return dt.toISOString();
}

/* -----------------------------------------
   MAIN COMPONENT
   ----------------------------------------- */
export default function UserSchedule() {
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const isMobile = useMediaQuery("(max-width: 640px)");
  // Option A uses fixed pixel widths
  const firstColPx = isMobile ? 55 : 80;
  const otherColPx = 100;

  const rowHeight = 36; // matches h-9 approx px

  const [filters, setFilters] = useState({
    pending: true,
    approved: true,
  });

  const toggleFilter = (key) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const fetchSchedule = useCallback(async () => {
    setError("");
    abortRef.current?.abort?.();

    const ctl = new AbortController();
    abortRef.current = ctl;

    try {
      const res = await api.get("/users/schedule", { signal: ctl.signal });

      const isoSchedule = res.data.schedule || {};

      const localSchedule = {};
      for (const isoUtc in isoSchedule) {
        const slotKey = isoUtcToSlotKey(isoUtc); // "YYYY-MM-DD_HH:mm"
        localSchedule[slotKey] = isoSchedule[isoUtc];
        localSchedule[slotKey].__utcIso = isoUtc;
      }

      setScheduleData({
        schedule: localSchedule,
        original: isoSchedule,
      });
    } catch (e) {
      if (!ctl.signal.aborted)
        setError(e?.message || "Failed to load schedule");
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
    return () => abortRef.current?.abort?.();
  }, [fetchSchedule]);

  const upcomingDays = useMemo(() => buildUpcomingDays(14), []);

  const timeSlots = useMemo(() => {
    if (!scheduleData) return [];

    const { start, end } = computeDynamicTimeWindowFromBookings(
      scheduleData.original
    );

    const times = [];
    let cursor = dayjs(`2025-01-01 ${start}`);
    const endTime = dayjs(`2025-01-01 ${end}`);

    while (cursor <= endTime) {
      times.push(cursor.format("HH:mm"));
      cursor = cursor.add(1, "hour");
    }

    return times.map((t) => ({ time: t, label: t }));
  }, [scheduleData]);

  const normalizeStatus = (s) => {
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower.startsWith("pending")) return "pending";
    if (lower === "booked" || lower === "approved") return "approved";
    return lower;
  };

  const calendarGrid = useMemo(() => {
    if (!scheduleData || timeSlots.length === 0) return null;
    const schedule = scheduleData.schedule;
    const days = upcomingDays;
    const times = timeSlots.map((t) => t.time);

    const dayBlocks = buildDayBlocks(schedule, days, times);
    const agenda = buildAgendaBlocks(schedule, days, times);

    return {
      schedule,
      days,
      times,
      dayBlocks,
      agenda,
    };
  }, [scheduleData, upcomingDays, timeSlots]);

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="border rounded-md overflow-hidden">
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!scheduleData || !calendarGrid) {
    return <div className="p-4 text-center">Loading schedule…</div>;
  }

  const { schedule, days, times, dayBlocks, agenda } = calendarGrid;

  /* container width for horizontal scroll area: firstCol + days * otherCol */
  const calendarWidth = firstColPx + days.length * otherColPx;
  const calendarHeight = times.length * rowHeight;

  return (
    <div className="w-full mx-auto space-y-4">
      <PageTitle
        title="Schedule Calendar"
        subtitle="View your upcoming bookings schedule"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-56">
            <div className="space-y-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Status
              </div>

              <div className="space-y-1">
                <Button
                  variant={filters.pending ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between text-sm"
                  onClick={() => toggleFilter("pending")}
                >
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                    Pending
                  </span>
                  {filters.pending && <Check className="h-3 w-3" />}
                </Button>

                <Button
                  variant={filters.approved ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between text-sm"
                  onClick={() => toggleFilter("approved")}
                >
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    Approved
                  </span>
                  {filters.approved && <Check className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </PageTitle>

      {!filters.pending && !filters.approved && (
        <div className="border p-3 text-center text-sm text-muted-foreground rounded-md">
          No filters active — enable a status to view bookings.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SCHEDULE GRID */}
        <div className="lg:col-span-8 xl:col-span-8">
          <div className="border rounded-md overflow-hidden dark:border-gray-800">
            {/* ⬇️ SCROLLABLE AREA (header moved inside) */}
            <div
              className="relative"
              style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: 600,
              }}
            >
              {/* ⬇️ HEADER NOW INSIDE SCROLLABLE DIV */}
              <div
                className="grid sticky top-0 z-30"
                style={{
                  gridTemplateColumns: `${firstColPx}px repeat(${days.length}, ${otherColPx}px)`,
                  width: `${calendarWidth}px`,
                }}
              >
                <div
                  className="sticky left-0 z-40 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-r"
                  style={{ width: firstColPx }}
                >
                  Time
                </div>

                {days.map((d) => (
                  <div
                    key={d.key}
                    className={cn(
                      "px-3 py-2 text-xs font-medium text-center border-b sticky top-0",
                      d.isToday
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : "bg-muted/40 text-muted-foreground dark:bg-gray-800"
                    )}
                    style={{ width: otherColPx }}
                  >
                    {d.label}
                  </div>
                ))}
              </div>

              {/* BACKGROUND GRID */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `${firstColPx}px repeat(${days.length}, ${otherColPx}px)`,
                  gridTemplateRows: `repeat(${times.length}, ${rowHeight}px)`,
                  width: `${calendarWidth}px`,
                  height: `${calendarHeight}px`,
                }}
              >
                {/* Time labels */}
                {times.map((t, ti) => (
                  <div
                    key={`time-${t}`}
                    style={{
                      gridColumn: 1,
                      gridRow: ti + 1,
                      width: firstColPx,
                    }}
                    className="sticky left-0 z-40 px-3 py-2 text-xs border-r border-b bg-background dark:bg-gray-900"
                  >
                    {t}
                  </div>
                ))}

                {/* Empty background cells */}
                {days.map((d, di) =>
                  times.map((t, ti) => {
                    const baseKey = `${d.key}_${t}`;
                    return (
                      <div
                        key={`base-${baseKey}`}
                        style={{
                          gridColumn: di + 2,
                          gridRow: ti + 1,
                          width: otherColPx,
                        }}
                        className="h-full border bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                      />
                    );
                  })
                )}
              </div>

              {/* EVENT OVERLAY */}
              <div
                className="absolute top-0 left-0 z-30 pointer-events-none"
                style={{
                  width: `${calendarWidth}px`,
                  height: `${calendarHeight}px`,
                }}
              >
                {days.map((d, di) => {
                  const blocks = dayBlocks[d.key] || [];
                  return blocks.map((b, bi) => {
                    const entry = b.entry;
                    const status = normalizeStatus(entry.status);
                    if (
                      (status === "pending" && !filters.pending) ||
                      (status === "approved" && !filters.approved)
                    ) {
                      return null;
                    }

                    const left = firstColPx + di * otherColPx;
                    const top = b.startIndex * rowHeight + rowHeight;
                    const width = otherColPx;
                    const height = b.span * rowHeight - 2;

                    const style = BOOKING_STATUS[entry.status]?.style;

                    return (
                      <TooltipProvider key={`overlay-${d.key}-${bi}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute text-xs flex items-center justify-center px-2 py-1 border rounded-md pointer-events-auto overflow-hidden",
                                style, "-mt-0.5"
                              )}
                              style={{
                                left,
                                top,
                                width,
                                height,
                              }}
                            >
                              <div className="truncate w-full text-center">
                                {BOOKING_STATUS[entry.status]?.label}
                              </div>
                            </div>
                          </TooltipTrigger>

                          <TooltipContent className="p-3 text-xs space-y-2 max-w-xs">
                            <div className="font-medium border-b pb-2">
                              {entry.resource}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {entry.location}
                              </div>
                              <div className="flex items-center gap-2">
                                <Box className="h-3 w-3" />
                                {entry.type}
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                {entry.purpose}
                              </div>
                              <div className="flex items-center gap-2">
                                <CircleDot className="h-3 w-3" />
                                {entry.status}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AGENDA VIEW */}
        <aside className="lg:col-span-4 xl:col-span-4">
          <AgendaView
            schedule={schedule}
            agenda={agenda}
            times={times}
            days={days}
            filters={filters}
          />
        </aside>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------
   Agenda View (same as before) - merges contiguous slots across days
   into single agenda entries using schedule.__utcIso when available.
   ----------------------------------------------------------------- */
function AgendaView({ schedule, agenda, filters }) {
  const normalizeStatus = (s) => {
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower.startsWith("pending")) return "pending";
    if (lower === "booked" || lower === "approved") return "approved";
    return lower;
  };

  const formatRangeFromSlots = (startSlotKey, endSlotKey, entry, schedule) => {
    const startEntry = schedule[startSlotKey];
    const endEntry = schedule[endSlotKey];

    let startIso = startEntry?.__utcIso ?? slotKeyToUtcIso(startSlotKey);
    let endIso = endEntry?.__utcIso ?? slotKeyToUtcIso(endSlotKey);

    const startDate = dayjs(startIso).format("YYYY-MM-DD");
    const endDate = dayjs(endIso).format("YYYY-MM-DD");

    // start of booking = start slot start
    const startTime = dayjs(startIso).format("HH:mm");

    // end of booking = end slot start + 1 hour
    const endTime = dayjs(endIso).add(1, "hour").format("HH:mm");

    return {
      startDate,
      endDate,
      startTime,
      endTime,
      isSameDay: startDate === endDate,
    };
  };

  const items = useMemo(() => {
    if (!agenda) return [];

    const filtered = agenda.filter((b) => {
      const s = normalizeStatus(b.entry.status);
      if (s === "pending" && !filters.pending) return false;
      if (s === "approved" && !filters.approved) return false;
      return true;
    });

    return filtered.map((b) => {
      const range = formatRangeFromSlots(
        b.startSlotKey,
        b.endSlotKey,
        b.entry,
        schedule
      );
      return {
        ...b,
        range,
      };
    });
  }, [agenda, filters, schedule]);

  return (
    <div className="border rounded-md p-3 space-y-2 dark:border-gray-800">
      <div className="text-sm font-medium">Agenda (14 days)</div>

      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          No upcoming bookings
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((block, idx) => {
            const entry = block.entry;
            const range = block.range;

            return (
              <li
                key={idx}
                className="text-xs flex items-center justify-between p-2 border rounded dark:border-gray-700"
              >
                <div>
                  <div className="font-medium">{entry.resource}</div>
                  <div className="text-muted-foreground">{entry.purpose}</div>
                </div>

                <div className="text-muted-foreground text-right">
                  {range.isSameDay ? (
                    <>
                      <div>{range.startDate}</div>
                      <div>
                        {range.startTime} – {range.endTime}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        {range.startDate} • {range.startTime}
                      </div>
                      <div>
                        {range.endDate} • {range.endTime}
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
