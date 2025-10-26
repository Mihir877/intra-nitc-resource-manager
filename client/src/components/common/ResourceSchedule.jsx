import { Button } from "@/components/ui/button";
import { useSlotSelection } from "@/hooks/useSlotSelection";
import { Clock } from "lucide-react";

const firstColPx = 80;
const otherColPx = 100;

const ResourceSchedule = ({ resourceId = "68f4675d69cf8e5719bc4cd8" }) => {
  const {
    error,
    scheduleData,
    upcomingDays,
    timeSlots,
    selectedSlots,
    handleSlotClick,
    clearSelection,
    getActualStartEnd,
    calculateDuration,
  } = useSlotSelection(resourceId);

  if (error) return <div>{error}</div>;
  if (!scheduleData) return null;

  if (error) {
    return (
      <div className="w-full max-w-screen-lg mx-auto">
        <div className="border rounded-md overflow-hidden">
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!scheduleData) {
    return null;
  }

  const { bookedSlots, unavailableSlots } = scheduleData;
  const { actualStart, actualEnd } = getActualStartEnd();
  const duration = calculateDuration();

  return (
    <div className="w-full max-w-screen-lg mx-auto space-y-4">
      {/* Selection Info & Clear Button */}
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
                  {/* <Clock className="w-3 h-3" /> */}
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
            <Button size="sm" onClick={() => {}}>
              Confirm Booking
            </Button>
          </div>
        )}
      </div>

      {/* Schedule Grid */}
      <div className="border rounded-md overflow-hidden">
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

            {/* Body */}
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
    </div>
  );
};

export default ResourceSchedule;
