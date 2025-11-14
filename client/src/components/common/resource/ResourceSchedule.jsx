// app/components/resource/ResourceSchedule.jsx

import { Button } from "@/components/ui/button";
import { useSlotSelection } from "@/hooks/useSlotSelection";
import { useState } from "react";
import { ConfirmBookingDialog } from "./ConfirmBookingDialog";
import { cn } from "@/lib/utils";
import api from "@/api/axios";

// NEW timezone utilities
import {
  slotKeyToUtcIso,
  addOneHourSlotKey,
  utcIsoToIstLabel,
} from "@/utils/timezone";

// Styling + layout constants
const firstColPx = 80;
const otherColPx = 100;

// Status styles
const STATUS_STYLES = {
  available: {
    bg: "bg-white border-green-200 hover:bg-green-50 dark:bg-gray-900 dark:border-green-900 dark:hover:bg-green-950/30",
    text: "text-gray-700 dark:text-gray-300",
    label: "",
  },
  booked: {
    bg: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800",
    text: "text-red-700 dark:text-red-400 font-semibold",
    label: "Booked",
  },
  pendingMine: {
    bg: "bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-400 font-medium",
    label: "Pending",
  },
  pendingOther: {
    bg: "bg-yellow-50 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:border-yellow-900 dark:hover:bg-yellow-900/50",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Pending",
  },
  softBlocked: {
    bg: "bg-slate-100 border-slate-300 dark:bg-slate-900 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400 font-medium",
    label: "Maint.",
  },
  cooldown: {
    bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
    text: "text-blue-600 dark:text-blue-400",
    label: "Cool",
  },
  unavailable: {
    bg: "bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-gray-800",
    text: "text-gray-400 dark:text-gray-500",
    label: "",
  },
};

const getTooltipText = (entry) => {
  if (!entry) return "Unavailable";
  return {
    booked: `Booked${entry.purpose ? `: ${entry.purpose}` : ""}${
      entry.user ? ` - ${entry.user}` : ""
    }`,
    pendingMine: "Your pending request",
    pendingOther: "Requested by someone else",
    softBlocked: "Maintenance",
    cooldown: "Cooldown",
    available: "Available",
    unavailable: "Unavailable",
  }[entry.status];
};

const getSlotClassName = ({ isSelected, isStart, isEnd, isSingle, status }) => {
  const base = "h-9 border text-xs font-medium select-none cursor-pointer";

  if (isSelected) {
    return cn(
      base,
      "bg-blue-400/40 text-white border-blue-500 dark:bg-blue-800/40 dark:border-blue-600",
      isSingle &&
        "rounded shadow-sm font-semibold border-2 border-blue-600 dark:border-blue-500",
      !isSingle && !isStart && !isEnd && "border-y-0",
      isStart &&
        "rounded-t border-b-0 border-l-4 border-l-blue-700/70 dark:border-l-blue-500/70",
      isEnd &&
        "rounded-b border-t-0 border-r-4 border-r-blue-700/70 dark:border-r-blue-500/70"
    );
  }

  const st = STATUS_STYLES[status] ?? STATUS_STYLES.unavailable;

  return cn(
    base,
    st.bg,
    st.text,
    "border",
    isStart && "rounded-t border-b-0",
    isEnd && "rounded-b border-t-0",
    isStart && isEnd && "border"
  );
};

const SlotCell = ({
  slotKey,
  entry,
  isSelected,
  isActualStart,
  isActualEnd,
  actualEnd,
  handleSlotClick,
}) => {
  if (!entry) {
    return (
      <div
        className="h-9 bg-gray-50 border border-gray-100 dark:bg-gray-700 dark:border-gray-800"
        title="Unavailable"
      />
    );
  }

  const isSingle = isActualStart && !actualEnd;
  const isRequestable = entry.isRequestable;

  const className = getSlotClassName({
    isSelected,
    isStart: isActualStart || entry.isStartSlot,
    isEnd: isActualEnd || entry.isEndSlot,
    isSingle,
    status: entry.status,
  });

  return (
    <button
      onClick={() => handleSlotClick(slotKey, isRequestable)}
      className={className}
      disabled={!isRequestable}
      title={getTooltipText(entry)}
      style={{ cursor: isRequestable ? "pointer" : "not-allowed" }}
    >
      {isSelected ? "✓" : STATUS_STYLES[entry.status]?.label}
    </button>
  );
};

const ResourceSchedule = ({ resourceId }) => {
  const {
    error,
    scheduleData,
    resource,
    upcomingDays,
    timeSlots,
    selectedSlots,
    handleSlotClick,
    clearSelection,
    getActualStartEnd,
    calculateDuration,
    slotKeyToUtcIso, // already from hook
    refetchSchedule,
  } = useSlotSelection(resourceId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="border rounded-md overflow-hidden p-4 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!scheduleData) {
    return <div className="w-full max-w-5xl mx-auto p-4">Loading...</div>;
  }

  const schedule = scheduleData.schedule;
  const { actualStart, actualEnd } = getActualStartEnd();
  const duration = calculateDuration();

  const submitRequest = async () => {
    if (!actualStart) return;

    setSubmitting(true);
    try {
      const endBoundary = actualEnd
        ? addOneHourSlotKey(actualEnd)
        : addOneHourSlotKey(actualStart);

      const startTime = slotKeyToUtcIso(actualStart);
      const endTime = slotKeyToUtcIso(endBoundary);

      await api.post("/requests", {
        resourceId,
        startTime,
        endTime,
        bookingDuration: duration.hours,
        purpose: purpose.trim(),
      });

      setConfirmOpen(false);
      clearSelection();
      setPurpose("");
      await refetchSchedule();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-md">
        <div className="text-sm font-medium">
          {selectedSlots.size ? (
            <>
              {selectedSlots.size} slots selected
              {duration && (
                <span className="ml-2 text-blue-600">
                  Duration: {duration.formatted}
                </span>
              )}
            </>
          ) : (
            <span>Select your booking time</span>
          )}
        </div>

        {selectedSlots.size > 0 && (
          <div className="flex gap-2">
            <Button onClick={clearSelection} variant="outline" size="sm">
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={!actualStart}
            >
              Confirm Booking
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="border rounded-md overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <div style={{ width: "max-content" }}>
            {/* Header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
              }}
            >
              <div
                className="sticky left-0 top-0 bg-muted px-3 py-2 border-b border-r text-xs font-medium"
                style={{ width: firstColPx }}
              >
                Time
              </div>

              {upcomingDays.map((d) => (
                <div
                  key={d.key}
                  className={cn(
                    "border-b px-3 py-2 text-xs font-medium text-center",
                    "bg-muted/40"
                  )}
                  style={{ width: otherColPx }}
                >
                  {d.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {timeSlots.map(({ time }) => (
              <div
                key={time}
                className="grid"
                style={{
                  gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
                }}
              >
                <div
                  className="sticky left-0 bg-background px-3 py-2 text-xs border-r border-b"
                  style={{ width: firstColPx }}
                >
                  {time}
                </div>

                {upcomingDays.map((d) => {
                  const slotKey = `${d.key}_${time}`;
                  const entry = schedule[slotKey];

                  return (
                    <SlotCell
                      key={slotKey}
                      slotKey={slotKey}
                      entry={entry}
                      isSelected={selectedSlots.has(slotKey)}
                      isActualStart={slotKey === actualStart}
                      isActualEnd={slotKey === actualEnd}
                      actualEnd={actualEnd}
                      handleSlotClick={handleSlotClick}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmBookingDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        purpose={purpose}
        onPurposeChange={setPurpose}
        submitting={submitting}
        resourceName={resource?.name ?? "Resource"}
        actualStart={actualStart}
        actualEnd={actualEnd}
        duration={duration}
        onSubmit={submitRequest}
        onChangeTime={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ResourceSchedule;
