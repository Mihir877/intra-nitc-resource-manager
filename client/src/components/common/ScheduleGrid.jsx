// app/components/schedule/ScheduleGrid.jsx
import { cn } from "@/lib/utils";

export default function ScheduleGrid({
  title,
  days,
  hours,
  entries,
  selecting,
  onCellMouseDown,
  onCellMouseEnter,
}) {
  const firstColPx = 80;
  const otherColPx = 110;

  const cellMeta = (dayKey, hour) => {
    const key = `${dayKey}_${hour}`;
    const entry = entries?.[key];
    const isBooked =
      entry?.status === "approved" || entry?.status === "pending";
    return { key, entry, isBooked };
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/50 text-sm font-medium">
        {title}
      </div>
      <div className="overflow-x-auto select-none">
        <div style={{ width: "max-content" }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `${firstColPx}px repeat(${days.length}, ${otherColPx}px)`,
            }}
          >
            <div
              className="sticky left-0 top-0 z-30 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-r"
              style={{ width: firstColPx }}
            >
              Time
            </div>
            {days.map((d) => (
              <div
                key={d.key}
                className="sticky top-0 z-20 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground text-center border-b"
                style={{ width: otherColPx }}
              >
                {d.label}
              </div>
            ))}
          </div>

          {hours.map((slot) => (
            <div
              key={slot.h}
              className="grid items-stretch"
              style={{
                gridTemplateColumns: `${firstColPx}px repeat(${days.length}, ${otherColPx}px)`,
              }}
            >
              <div
                className="sticky left-0 z-20 bg-background px-3 py-2 text-xs border-r border-b"
                style={{ width: firstColPx }}
              >
                {slot.label}
              </div>

              {days.map((d) => {
                const { key, entry, isBooked } = cellMeta(d.key, slot.h);

                // selection highlighting
                const inSelection =
                  selecting &&
                  selecting.dayKey === d.key &&
                  slot.h >= Math.min(selecting.startHour, selecting.endHour) &&
                  slot.h <= Math.max(selecting.startHour, selecting.endHour);

                return (
                  <div
                    key={key}
                    onMouseDown={() =>
                      onCellMouseDown?.(d.key, slot.h, { isBooked })
                    }
                    onMouseEnter={() =>
                      onCellMouseEnter?.(d.key, slot.h, { isBooked })
                    }
                    className={cn(
                      "h-9 border text-xs flex items-center justify-center transition-colors",
                      isBooked
                        ? "bg-blue-100 text-blue-700 font-medium" // approved/pending
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100",
                      inSelection && "bg-emerald-100 text-emerald-700"
                    )}
                    title={
                      isBooked
                        ? `${entry.resourceName || "Resource"} • ${
                            entry.purpose || ""
                          } • ${entry.status?.toUpperCase()}`
                        : "Click and drag to plan"
                    }
                  >
                    {isBooked ? entry.resourceName || "Booked" : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 text-[11px] text-muted-foreground border-t">
        Legend: Approved/Pending = blue, Selection = green, Empty = gray
      </div>
    </div>
  );
}
