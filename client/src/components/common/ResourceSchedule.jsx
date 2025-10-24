import React, { useEffect, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/axios";
import {
  toISODate,
  addDays,
  addMinutes,
  isBefore,
  isAfterOrEqual,
  startOfDay,
  endOfDay,
  clampTo14Days,
  formatTime,
  indexBookingsByDay,
  cellBooked,
  useTimeSlots,
  useTwoWeekDays,
} from "@/lib/scheduleHelpers";

const slotMinutes = 60;
const dayStartHour = 8;
const dayEndHour = 20;

const ResourceSchedule = ({ resourceId, onSelectSlot }) => {
  const today = useMemo(() => new Date(), []);
  const windowRange = useMemo(() => clampTo14Days(today), [today]);

  const days = useTwoWeekDays(today, addDays, toISODate, (d) =>
    d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
  );

  const slots = useTimeSlots(slotMinutes, dayStartHour, dayEndHour);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Changed variable names here for clarity
  const [scheduleData, setScheduleData] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`requests/schedule/${resourceId}`);
      const schedule = res?.data?.schedule;
      setScheduleData(schedule);
    } catch (e) {
      setError(e.message || "Failed to load schedule");
    } finally {
      console.log("hello");
      setLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bookingsByDay = useMemo(
    () =>
      indexBookingsByDay(scheduleData, windowRange.from, windowRange.to, {
        addDays,
        isAfterOrEqual,
        isBefore,
        startOfDay,
        endOfDay,
        toISODate,
      }),
    [scheduleData, windowRange]
  );

  const canBook = useCallback(
    (cellStart) => {
      const now = new Date();
      return (
        isAfterOrEqual(cellStart, now) &&
        isAfterOrEqual(cellStart, windowRange.from) &&
        cellStart <= windowRange.to
      );
    },
    [windowRange]
  );

  const handleCellClick = useCallback(
    (dayDate, h, m) => {
      const start = new Date(
        dayDate.getFullYear(),
        dayDate.getMonth(),
        dayDate.getDate(),
        h,
        m
      );
      const end = addMinutes(start, slotMinutes);
      const dayKey = toISODate(dayDate);
      const overlap = cellBooked(bookingsByDay.get(dayKey), start, end);
      if (!canBook(start) || overlap) return;
      onSelectSlot?.({ start, end, resourceId });
    },
    [bookingsByDay, onSelectSlot, resourceId, canBook]
  );

  // Exact table format variables
  const firstColPx = 80; // Time column width
  const otherColPx = 100; // Day columns width

  return (
    <div className="w-full max-w-screen-lg mx-auto">
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {/* Single horizontal scroller for header + body */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          {/* Inner track controls min width so X scroll appears when needed */}
          <div className="" style={{ width: "max-content" }}>
            {/* Header: sticky top, sticky first cell optional (left) */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
              }}
            >
              {/* Sticky header first cell (left + top) */}
              <div
                className="sticky left-0 top-0 z-30 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-r"
                style={{ width: firstColPx }}
              >
                Time
              </div>

              {days.map((d) => (
                <div
                  key={d.key}
                  role="columnheader"
                  className="sticky top-0 z-20 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground text-center border-b"
                  style={{ width: otherColPx }}
                  title={d.date.toDateString()}
                >
                  {d.label}
                </div>
              ))}
            </div>

            {/* Body: vertical scroll only, shares same horizontal scroller */}
            {loading ? (
              <div className="p-2 space-y-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
                    }}
                  >
                    <div className="sticky left-0 z-10 bg-background px-3">
                      <Skeleton className="h-7 w-[80px]" />
                    </div>
                    {Array.from({ length: 14 }).map((__, j) => (
                      <div key={j} className="px-2">
                        <Skeleton className="h-7 w-full" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="">
                {slots.map((slot) => (
                  <div
                    key={`${slot.h}:${slot.m}`}
                    role="row"
                    className="grid items-stretch"
                    style={{
                      gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
                    }}
                  >
                    {/* Sticky first column for each row (Time labels) */}
                    <div
                      className="sticky left-0 z-20 bg-background px-3 py-2 text-xs border-r border-b"
                      style={{ width: firstColPx, contain: "paint" }}
                    >
                      {slot.label}
                    </div>

                    {days.map((d) => {
                      const cellStart = new Date(
                        d.date.getFullYear(),
                        d.date.getMonth(),
                        d.date.getDate(),
                        slot.h,
                        slot.m,
                        0,
                        0
                      );
                      const cellEnd = addMinutes(cellStart, slotMinutes);
                      const dayKey = toISODate(d.date);
                      const overlap = cellBooked(
                        bookingsByDay.get(dayKey),
                        cellStart,
                        cellEnd
                      );
                      const disabled = !!overlap || !canBook(cellStart);
                      return (
                        <button
                          key={dayKey + `-${slot.h}-${slot.m}`}
                          role="gridcell"
                          aria-label={
                            overlap
                              ? `${d.date.toDateString()} ${
                                  slot.label
                                } booked ${formatTime(
                                  overlap.start
                                )} - ${formatTime(overlap.end)}`
                              : `${d.date.toDateString()} ${
                                  slot.label
                                } available`
                          }
                          disabled={disabled}
                          onClick={() =>
                            handleCellClick(d.date, slot.h, slot.m)
                          }
                          className={cn(
                            "h-9 rounded border border-green-500/20 text-xs transition-colors",
                            disabled
                              ? "bg-muted text-muted-foreground cursor-not-allowed border-gray-200"
                              : "hover:bg-green-100",
                            overlap ? "bg-red-100" : ""
                          )}
                          title={
                            overlap
                              ? `${overlap.title} (${formatTime(
                                  overlap.start
                                )} - ${formatTime(overlap.end)}`
                              : undefined
                          }
                        >
                          {overlap ? "Booked" : ""}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceSchedule;
