// app/components/resource/ResourceSchedule.jsx
"use client";
import { Button } from "@/components/ui/button";
import { useSlotSelection } from "@/hooks/useSlotSelection";
import { useState } from "react";
import { ConfirmBookingDialog } from "./ConfirmBookingDialog";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
dayjs.extend(utc);

const keyToIsoUtc = (key) => {
  const [d, h] = key.split("_");
  return dayjs.utc(`${d}T${String(h).padStart(2, "0")}:00:00Z`).toISOString();
};
const ensureEndPlus1h = (startKey, endKey) => {
  if (!endKey)
    return `${startKey.split("_")[0]}_${
      parseInt(startKey.split("_")[1], 10) + 1
    }`;
  const [sd, sh] = startKey.split("_");
  const [ed, eh] = endKey.split("_");
  if (sd === ed && parseInt(eh, 10) === parseInt(sh, 10)) {
    return `${ed}_${parseInt(eh, 10) + 1}`;
  }
  return endKey;
};

const firstColPx = 80;
const otherColPx = 100;

const ResourceSchedule = ({ resourceId = "68f4675d69cf8e5719bc4cd8" }) => {
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
  } = useSlotSelection(resourceId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (error) {
    return (
      <div className="w-full max-w-screen-lg mx-auto">
        <div className="border rounded-md overflow-hidden">
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }
  if (!scheduleData) return null;

  const { bookedSlots, unavailableSlots } = scheduleData;
  const { actualStart, actualEnd } = getActualStartEnd();
  const duration = calculateDuration();

  const handleConfirmClick = () => setConfirmOpen(true);

  const submitRequest = async () => {
    if (!actualStart) return;
    setSubmitting(true);
    try {
      const fixedEndKey = ensureEndPlus1h(actualStart, actualEnd);
      const startTime = keyToIsoUtc(actualStart);
      const endTime = keyToIsoUtc(fixedEndKey);

      const payload = {
        resourceId,
        startTime,
        endTime,
        bookingDuration: duration?.hours || 0,
        purpose: purpose.trim(),
      };

      const p = api.post("/requests", payload);

      await notify.promise(p, {
        loading: "Submitting request…",
        success: "Request submitted",
        error: "Submission failed",
      });
      notify.success("You’ll be notified", "Approval status will be emailed.");
      setConfirmOpen(false);
      clearSelection();
      setPurpose("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto space-y-4">
      <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-md">
        <div
          className="flex align-center text-sm font-medium  min-h-[32px]"
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
            <span className="text-muted-foreground">
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
              disabled={!actualStart || !actualEnd}
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
                    const isUnavailable = unavailableSlots[slotKey];
                    const bookingInfo = bookedSlots[slotKey];
                    const isSelected = selectedSlots.has(slotKey);
                    const isActualStart = slotKey === actualStart;
                    const isActualEnd = slotKey === actualEnd;
                    const isAvailable = !isUnavailable && !bookingInfo;
                    const isSingle = isActualStart && !actualEnd;

                    if (isUnavailable) {
                      return (
                        <div
                          key={slotKey}
                          className="h-9 bg-gray-50 border border-gray-100 cursor-not-allowed"
                        />
                      );
                    }

                    return (
                      <button
                        key={slotKey}
                        onClick={() => handleSlotClick(slotKey, isAvailable)}
                        className={`h-9 border text-xs transition-colors select-none ${
                          bookingInfo
                            ? "bg-red-100 text-red-500/60 font-semibold cursor-not-allowed border-red-200 rounded"
                            : isSelected
                            ? isSingle
                              ? "bg-blue-300 text-white border-blue-500 font-semibold border-2 rounded cursor-pointer"
                              : isActualStart
                              ? "bg-blue-300 text-white border-blue-400 border-b-0 border-l-4 border-l-blue-800 rounded-t-sm cursor-pointer"
                              : isActualEnd
                              ? "bg-blue-300 text-white border-blue-400 border-t-0 border-r-4 border-r-blue-800 rounded-b-sm cursor-pointer"
                              : "bg-blue-300 text-white border-blue-400 border-y-0 cursor-pointer"
                            : "border-green-500/20 hover:bg-green-100 cursor-pointer"
                        }`}
                        disabled={!isAvailable}
                        title={
                          bookingInfo
                            ? `${bookingInfo.purpose} - ${bookingInfo.user}`
                            : isSelected
                            ? "Selected"
                            : "Available"
                        }
                      >
                        {bookingInfo ? "Booked" : isSelected ? "✓" : ""}
                      </button>
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
