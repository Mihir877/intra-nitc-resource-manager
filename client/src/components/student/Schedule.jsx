import React from "react";
import dayjs from "dayjs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8:00 to 20:00
const DAYS = Array.from({ length: 7 }, (_, d) => dayjs().startOf("week").add(d, "day"));

// Dummy bookings: array of { dayIndex, startHour, endHour, text }
const BOOKINGS = [
  { day: 1, start: 10, end: 12, text: "Lab Booking" },    // Monday 10-12
  { day: 2, start: 9, end: 10, text: "Classroom" },       // Tue 9-10
  { day: 2, start: 17, end: 19, text: "Event" },          // Tue 17-19
  { day: 4, start: 8, end: 11, text: "Discussion" },      // Thu 8-11
  { day: 6, start: 14, end: 16, text: "Seminar" },        // Sat 14-16
];

// Helper to find a booking for a given day/hour
function getBooking(day, hour) {
  return BOOKINGS.find(b => b.day === day && hour >= b.start && hour < b.end);
}

export default function CalendarWithTimeGrid() {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-2 md:p-4">
        <div className="grid grid-cols-8 w-fit min-w-full">
          <div className="col-span-1" />
          {DAYS.map((d, idx) => (
            <div key={idx} className="text-center font-medium text-muted-foreground px-2 py-1">
              {d.format("ddd D")}
            </div>
          ))}
        </div>
        <div>
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0 hover:bg-accent/20">
              <div className="col-span-1 text-right pr-2 py-2 text-xs font-mono text-muted-foreground min-w-[44px]">{String(hour).padStart(2,"0")}:00</div>
              {DAYS.map((d, dayIdx) => {
                const b = getBooking(dayIdx, hour);
                // Merge cells for booking duration (show only on booking start hour)
                if (b && hour === b.start) {
                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        "col-span-1 py-2 px-2",
                        "relative",
                        "bg-primary/10 text-primary rounded transition min-h-[44px]",
                      )}
                      style={{ gridRow: `span ${b.end - b.start}` }}
                    >
                      <span className="font-medium">{b.text}</span>
                      <Badge className="ml-2">{`${b.start}:00 - ${b.end}:00`}</Badge>
                    </div>
                  );
                }
                // Covered by merged cell above, render as empty
                if (b && hour > b.start && hour < b.end) return null;
                // Default empty slot
                return (
                  <div key={dayIdx} className="border-l min-h-[44px] py-2 px-2" />
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
