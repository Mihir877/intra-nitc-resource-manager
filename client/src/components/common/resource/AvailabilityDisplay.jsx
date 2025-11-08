// app/components/common/AvailabilityDisplay.jsx
import React from "react";
import { CalendarDays } from "lucide-react";

// Format availability as:
// 08:00-17:00  |  Mon - Fri
// 08:00-22:00  |  Sat
function formatAvailability(avail) {
  if (!avail?.length) return "No availability";
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const short = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  const sorted = [...avail].sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  const groups = [];
  for (const item of sorted) {
    const hours24 = `${item.startTime}–${item.endTime}`;
    const last = groups[groups.length - 1];
    if (
      last &&
      last.hours24 === hours24 &&
      dayOrder.indexOf(item.day) === dayOrder.indexOf(last.to) + 1
    ) {
      last.to = item.day;
    } else {
      groups.push({ from: item.day, to: item.day, hours24 });
    }
  }

  // Ensure HH:mm with leading zeros (e.g., 08:00)
  const toHHmm = (t) => {
    const [H, m] = t.split(":").map(Number);
    const hh = String(H).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const lines = groups.map((g) => {
    const days =
      g.from === g.to ? short[g.from] : `${short[g.from]} - ${short[g.to]}`;
    const [start, end] = g.hours24.split("–");
    return `${toHHmm(start)}-${toHHmm(end)}  |  ${days}`;
  });

  return lines.join("\n");
}

export default function AvailabilityDisplay({ availability }) {
  const summary = formatAvailability(availability);
  return (
    <div className="mt-2 text-sm">
      <div className="inline-flex items-center gap-1 text-muted-foreground">
        <CalendarDays className="h-3 w-3" />
        Availability:
      </div>
      <div className="text-sm text-muted-foreground">
        <div className="whitespace-pre-line">{summary}</div>
      </div>
    </div>
  );
}
