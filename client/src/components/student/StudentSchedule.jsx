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
import {
  Book,
  Box,
  Building2,
  Cpu,
  Filter,
  Monitor,
  Check,
  Clock,
  MapPin,
  CircleDot,
  FileText,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  parseSlotKeyToIso,
  buildUpcomingDays,
  clampViewHours,
  buildTimeSlots,
  getBookingTimeInfo,
  coalesceContiguousBlocks,
} from "@/utils/dateUtils";
import { Separator } from "../ui/separator";
import PageTitle from "../common/PageTitle";

const VIEW_START_HOUR = 8;
const VIEW_END_HOUR = 22;

// 🌙 Adaptive dark-mode styles (preserve vivid light mode feel)
const BOOKING_STATUS = {
  available: {
    style:
      "bg-white border-green-500/20 text-gray-600 hover:bg-green-50 dark:bg-gray-900 dark:border-green-900/40 dark:text-gray-300 dark:hover:bg-green-950/20",
    label: "",
  },
  booked: {
    style:
      "bg-red-50 hover:bg-red-100 border-red-200 text-red-600 font-semibold dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:border-red-800 dark:text-red-400",
    label: "Booked",
  },
  pendingMine: {
    style:
      "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-700 font-medium dark:bg-amber-950/40 dark:hover:bg-amber-900/40 dark:border-amber-900 dark:text-amber-400",
    label: "Pending",
  },
  pendingOther: {
    style:
      "bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 font-medium dark:bg-yellow-950/30 dark:hover:bg-yellow-900/50 dark:border-yellow-900 dark:text-yellow-400",
    label: "Pending",
  },
  softBlocked: {
    style:
      "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 font-medium dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
    label: "Maint.",
  },
  cooldown: {
    style:
      "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 dark:border-blue-900 dark:text-blue-400",
    label: "Cool",
  },
  unavailable: {
    style:
      "bg-gray-50 border-gray-100 text-gray-400 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-500",
    label: "",
  },
};

const firstColPx = 80;
const otherColPx = 100;

export default function UserSchedule() {
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const [filters, setFilters] = useState({
    pending: true,
    approved: true,
  });

  const toggleFilter = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const fetchSchedule = useCallback(async () => {
    setError("");
    abortRef.current?.abort?.();
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const res = await api.get("/users/schedule", { signal: ctl.signal });
      const isoSchedule = res.data.schedule || {};
      const timeRange = res.data.timeRange || { startHour: 0, endHour: 24 };
      setScheduleData({ schedule: isoSchedule, timeRange });
    } catch (e) {
      if (ctl.signal.aborted) return;
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
    const { startHour, endHour } = scheduleData.timeRange || {};
    const { safeStart, safeEnd } = clampViewHours(
      startHour,
      endHour,
      VIEW_START_HOUR,
      VIEW_END_HOUR
    );
    return buildTimeSlots(safeStart, safeEnd);
  }, [scheduleData]);

  const normalizeStatus = (s) => {
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower.startsWith("pending")) return "pending";
    if (lower === "booked" || lower === "approved") return "approved";
    return lower;
  };

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="border rounded-md overflow-hidden">
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!scheduleData) return null;

  return (
    <div className="w-full mx-auto space-y-4">
      <PageTitle
        title="Calendar"
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
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                    Pending
                  </div>
                  {filters.pending && (
                    <Check className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                  )}
                </Button>

                <Button
                  variant={filters.approved ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between text-sm"
                  onClick={() => toggleFilter("approved")}
                >
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    Approved
                  </div>
                  {filters.approved && (
                    <Check className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                  )}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </PageTitle>

      {!filters.pending && !filters.approved && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 border p-3 rounded-md">
          No filters active — enable a status to view bookings.
        </div>
      )}

      {/* Schedule grid and agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Schedule Grid */}
        <div className="lg:col-span-8 xl:col-span-8">
          <div className="border rounded-md overflow-hidden overflow-x-auto dark:border-gray-800">
            <div style={{ width: "max-content" }}>
              {/* Header Row */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
                }}
              >
                <div
                  className="sticky left-0 top-0 z-30 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-r border-border dark:bg-gray-800"
                  style={{ width: firstColPx }}
                >
                  Time
                </div>
                {upcomingDays.map((d) => (
                  <div
                    key={d.key}
                    className={cn(
                      "sticky top-0 z-20 px-3 py-2 text-xs font-medium text-center border-b border-border",
                      d.isToday
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : "bg-muted/40 text-muted-foreground dark:bg-gray-800 dark:text-gray-400"
                    )}
                    style={{ width: otherColPx }}
                  >
                    {d.label}
                  </div>
                ))}
              </div>

              {/* Hour Rows */}
              <div>
                {timeSlots.map((slot) => (
                  <div
                    key={slot.h}
                    className="grid items-stretch"
                    style={{
                      gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
                    }}
                  >
                    {/* Hour Label */}
                    <div
                      className="sticky left-0 z-20 bg-background px-3 py-2 text-xs border-r border-b dark:bg-gray-900 dark:border-gray-800"
                      style={{ width: firstColPx }}
                    >
                      {slot.label}
                    </div>

                    {/* Day Cells */}
                    {upcomingDays.map((d) => {
                      const slotKey = `${d.key}_${slot.h}`;
                      const iso = parseSlotKeyToIso(slotKey);
                      const entry = scheduleData.schedule[iso];

                      if (!entry) {
                        return (
                          <div
                            key={slotKey}
                            className="h-9 bg-gray-50 border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                            title="Unavailable"
                          />
                        );
                      }

                      const status = normalizeStatus(entry.status);
                      if (
                        (status === "pending" && !filters.pending) ||
                        (status === "approved" && !filters.approved)
                      ) {
                        return (
                          <div
                            key={slotKey}
                            className="h-9 bg-gray-50 border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                            title="Filtered out"
                          />
                        );
                      }

                      const styleToken =
                        BOOKING_STATUS[entry.status] ??
                        BOOKING_STATUS.unavailable;
                      const className = cn(
                        "h-9 border text-xs select-none rounded-none",
                        styleToken.style,
                        entry.isStartSlot && "rounded-t border-b-0",
                        entry.isEndSlot && "rounded-b border-t-0",
                        entry.isStartSlot && entry.isEndSlot && "border"
                      );

                      const label = BOOKING_STATUS[entry.status]?.label || "";

                      return (
                        <TooltipProvider key={slotKey} delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                key={slotKey}
                                className={className}
                                role="gridcell"
                                aria-label={`${slot.label} ${d.label} ${entry.status}`}
                              >
                                {label}
                              </Button>
                            </TooltipTrigger>

                            <TooltipContent
                              side="right"
                              className="max-w-xs p-3 space-y-2 text-xs dark:bg-gray-900 dark:text-gray-300"
                            >
                              <div className="font-medium border-b pb-2 dark:border-gray-700">
                                {entry?.resource}
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-gray-500" />
                                  <span>
                                    {entry?.location || "No location"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Box className="h-3 w-3 text-gray-500" />
                                  <span className="capitalize">
                                    {entry?.type || "Resource"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-gray-500" />
                                  <span>
                                    {entry?.purpose || "No purpose specified"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <CircleDot className="h-3 w-3 text-gray-500" />
                                  <span className="capitalize">
                                    {entry?.status}
                                  </span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agenda Panel */}
        <aside className="lg:col-span-4 xl:col-span-4">
          <div className="lg:sticky lg:top-4 overflow-x-auto">
            <AgendaView schedule={scheduleData.schedule} filters={filters} />
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- AgendaView Component ---
function AgendaView({ schedule, filters }) {
  const normalizeStatus = (s) => {
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower.startsWith("pending")) return "pending";
    if (lower === "booked" || lower === "approved") return "approved";
    return lower;
  };

  const items = useMemo(() => {
    const all = coalesceContiguousBlocks(schedule);
    return all.filter((it) => {
      const s = normalizeStatus(it.entry.status);
      if (s === "pending" && !filters.pending) return false;
      if (s === "approved" && !filters.approved) return false;
      return true;
    });
  }, [schedule, filters]);

  return (
    <div className="border rounded-md p-3 space-y-2 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <div className="text-sm font-medium">Agenda (14 days)</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground dark:text-gray-500">
          No upcoming bookings
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, idx) => (
            <li
              key={idx}
              className="text-xs flex items-center justify-between p-2 border rounded dark:border-gray-700"
            >
              <div>
                <div className="font-medium">
                  {it.entry.resource || "Booking"}
                </div>
                <div className="text-muted-foreground dark:text-gray-400">
                  {it.entry.purpose || "No purpose specified"}
                </div>
                <div className="text-muted-foreground dark:text-gray-400">
                  {it.entry.location || ""}
                </div>
              </div>

              <div>
                {(() => {
                  const t = getBookingTimeInfo(it.start, it.end);
                  return (
                    <>
                      {t.isSameDay ? (
                        <>
                          <div className="text-muted-foreground dark:text-gray-400">
                            {t.startDate}
                          </div>
                          <div className="text-muted-foreground dark:text-gray-400">
                            {t.startTime} – {t.endTime}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-1 text-muted-foreground dark:text-gray-400">
                            {t.startDate}
                            <Separator
                              orientation="vertical"
                              className="h-4 w-0.5 bg-gray-300 dark:bg-gray-700"
                            />
                            {t.startTime}
                          </div>
                          <div className="flex gap-1 justify-end text-muted-foreground dark:text-gray-400">
                            {t.endDate}{" "}
                            <Separator
                              orientation="vertical"
                              className="h-4 w-0.5 bg-gray-300 dark:bg-gray-700"
                            />{" "}
                            {t.endTime}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
