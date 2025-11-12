import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function AvailabilityEditor({ control, name = "availability" }) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="border border-border rounded-lg px-3 py-2 bg-muted text-sm ">
      {days.map((day, i) => (
        <Controller
          key={day}
          name={`${name}.${i}`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border/60 last:border-none py-2">
              {/* Day label */}
              <span className="w-20 font-medium text-foreground text-xs">
                {day}
              </span>

              {/* Time + Toggle wrapper */}
              <div className="flex items-center justify-between flex-1 gap-3 min-w-[200px]">
                {/* Time pickers */}
                <div className="flex items-center gap-1">
                  <Input
                    type="time"
                    value={value?.startTime || ""}
                    onChange={(e) =>
                      onChange({ ...value, startTime: e.target.value })
                    }
                    disabled={!value?.enabled}
                    className="w-20 h-8 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">–</span>
                  <Input
                    type="time"
                    value={value?.endTime || ""}
                    onChange={(e) =>
                      onChange({ ...value, endTime: e.target.value })
                    }
                    disabled={!value?.enabled}
                    className="w-20 h-8 text-xs"
                  />
                </div>

                {/* Switch */}
                <Switch
                  checked={value?.enabled}
                  onCheckedChange={(val) =>
                    onChange({
                      ...value,
                      enabled: val,
                      startTime: val ? value?.startTime || "09:00" : "",
                      endTime: val ? value?.endTime || "17:00" : "",
                    })
                  }
                  className="scale-90"
                />
              </div>
            </div>
          )}
        />
      ))}
    </div>
  );
}
