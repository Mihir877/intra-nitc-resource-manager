// app/components/resource/ResourceSchedule.jsx
import { Button } from "@/components/ui/button";
import { useSlotSelection } from "@/hooks/useSlotSelection";
import { useState } from "react";
import { ConfirmBookingDialog } from "./ConfirmBookingDialog";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
dayjs.extend(utc);

// Convert slot key to ISO timestamp
const keyToIsoUtc = (key) => {
  const [d, h] = key.split("_");
  return dayjs.utc(`${d}T${String(h).padStart(2, "0")}:00:00Z`).toISOString();
};

// Add 1 hour to a slot key to get the END boundary time
const addOneHour = (slotKey) => {
  const [date, hour] = slotKey.split("_");
  const nextHour = parseInt(hour, 10) + 1;

  // Handle day rollover (23:00 → next day 00:00)
  if (nextHour >= 24) {
    const nextDate = dayjs(date).add(1, "day").format("YYYY-MM-DD");
    return `${nextDate}_0`;
  }

  return `${date}_${nextHour}`;
};

const firstColPx = 80;
const otherColPx = 100;

// Status-based styling configuration
const STATUS_STYLES = {
  available: {
    bg: "bg-white border-green-500/20 hover:bg-green-50",
    text: "text-gray-600",
    label: "",
  },
  booked: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-600 font-semibold",
    label: "Booked",
  },
  pendingMine: {
    bg: "bg-amber-50 border-amber-300",
    text: "text-amber-700 font-medium",
    label: "Pending",
  },
  pendingOther: {
    bg: "bg-yellow-50 border-yellow-300 hover:bg-yellow-100",
    text: "text-yellow-700",
    label: "Pending",
  },
  softBlocked: {
    bg: "bg-slate-100 border-slate-300",
    text: "text-slate-600 font-medium",
    label: "Maint.",
  },
  cooldown: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-600",
    label: "Cool",
  },
  unavailable: {
    bg: "bg-gray-50 border-gray-100",
    text: "text-gray-400",
    label: "",
  },
};

const getTooltipText = (entry) => {
  if (!entry) return "Unavailable";

  const tooltips = {
    booked: `Booked${entry.purpose ? `: ${entry.purpose}` : ""}${
      entry.user ? ` - ${entry.user}` : ""
    }`,
    pendingMine: "Your pending request",
    pendingOther: "Requested by someone else",
    softBlocked: "Maintenance",
    cooldown: "Cooldown period",
    available: "Available - Click to select",
    unavailable: "Unavailable",
  };

  return tooltips[entry.status] || tooltips.unavailable;
};

const getSlotClassName = ({ isSelected, isStart, isEnd, isSingle, status }) => {
  const base = "h-9 border text-xs transition-colors select-none";

  // Selection variants first (highest priority)
  if (isSelected) {
    return cn(
      base,
      // shared selected styling
      "bg-blue-300 text-white border-blue-500",
      // specific shapes
      isSingle &&
        "bg-blue-400 font-semibold border-2 border-blue-600 rounded shadow-sm",
      !isSingle && !isStart && !isEnd && "border-y-0",
      isStart && "rounded-t border-b-0 border-l-4 border-l-blue-700",
      isEnd && "rounded-b border-t-0 border-r-4 border-r-blue-700"
    );
  }

  // Status-based variants
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.unavailable;

  return cn(
    base,
    s.bg,
    s.text,
    s.border,
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
        key={slotKey}
        className="h-9 bg-gray-50 border border-gray-100"
        title="Unavailable"
      />
    );
  }

  const isSingle = isActualStart && !actualEnd;
  const isRequestable = entry.isRequestable;
  const statusStyle = STATUS_STYLES[entry.status] || STATUS_STYLES.unavailable;

  const className = getSlotClassName({
    isSelected,
    isStart: isActualStart || entry.isStartSlot,
    isEnd: isActualEnd || entry.isEndSlot,
    isSingle,
    status: entry.status,
  });

  const tooltip = getTooltipText(entry);
  const label = isSelected ? "✓" : statusStyle.label;

  return (
    <button
      key={slotKey}
      onClick={() => handleSlotClick(slotKey, isRequestable)}
      className={className}
      disabled={!isRequestable}
      title={tooltip}
      style={{ cursor: isRequestable ? "pointer" : "not-allowed" }}
    >
      {label}
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
    slotKeyToIso,
  } = useSlotSelection(resourceId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const schedule = scheduleData.schedule || {};
  const { actualStart, actualEnd } = getActualStartEnd();
  const duration = calculateDuration();

  const handleConfirmClick = () => setConfirmOpen(true);

  const submitRequest = async () => {
    if (!actualStart) return;
    setSubmitting(true);
    try {
      // CRITICAL: End slot needs +1 hour to represent the END boundary
      // Example: slot "16" (4pm) represents 4:00-5:00, so end time is 5:00
      const endSlotKey = actualEnd || actualStart; // Single slot: use start as end
      const endBoundaryKey = addOneHour(endSlotKey);

      const startTime = keyToIsoUtc(actualStart);
      const endTime = keyToIsoUtc(endBoundaryKey);

      const payload = {
        resourceId,
        startTime,
        endTime,
        bookingDuration: duration?.hours || 1, // Single slot = 1 hour
        purpose: purpose.trim(),
      };

      await api.post("/requests", payload);
      notify.success("Request submitted", "Approval status will be emailed.");
      setConfirmOpen(false);
      clearSelection();
      setPurpose("");
    } catch (e) {
      console.error(e);
      notify.error(
        "Submission failed",
        e?.response?.data?.message || "Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-md">
        <div
          className="flex align-center text-sm font-medium min-h-8"
          style={{ alignItems: "center" }}
        >
          {selectedSlots.size > 0 ? (
            <span>
              {selectedSlots.size} slot{selectedSlots.size !== 1 ? "s" : ""}{" "}
              selected
              {duration && (
                <span className="ml-2 text-blue-600 font-semibold">
                  Duration: {duration.formatted}
                </span>
              )}
              {actualStart && !actualEnd && (
                <span className="text-muted-foreground ml-2">
                  (Click to select end time)
                </span>
              )}
            </span>
          ) : (
            <span className="text-blue-800">
              Select your booking time from the schedule below
            </span>
          )}
        </div>
        {selectedSlots.size > 0 && (
          <div className="flex gap-2">
            <Button onClick={clearSelection} variant="outline" size="sm">
              Clear Selection
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmClick}
              disabled={!actualStart}
            >
              Confirm Booking
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ width: "max-content" }}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
              }}
            >
              <div
                className="sticky left-0 top-0 z-30 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-r"
                style={{ width: firstColPx }}
              >
                Time
              </div>
              {upcomingDays.map((d) => (
                <div
                  key={d.key}
                  className="sticky top-0 z-20 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground text-center border-b"
                  style={{ width: otherColPx }}
                >
                  {d.label}
                </div>
              ))}
            </div>

            <div>
              {timeSlots.map((slot) => (
                <div
                  key={slot.h}
                  className="grid items-stretch"
                  style={{
                    gridTemplateColumns: `${firstColPx}px repeat(14, ${otherColPx}px)`,
                  }}
                >
                  <div
                    className="sticky left-0 z-20 bg-background px-3 py-2 text-xs border-r border-b"
                    style={{ width: firstColPx }}
                  >
                    {slot.label}
                  </div>

                  {upcomingDays.map((d) => {
                    const slotKey = `${d.key}_${slot.h}`;
                    const isoKey = slotKeyToIso(slotKey);
                    const entry = schedule[isoKey];

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
      </div>

      <ConfirmBookingDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        resourceName={resource?.name ?? "Resource"}
        actualStart={actualStart}
        actualEnd={actualEnd}
        duration={duration}
        purpose={purpose}
        onPurposeChange={setPurpose}
        onSubmit={submitRequest}
        submitting={submitting}
        onChangeTime={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ResourceSchedule;
