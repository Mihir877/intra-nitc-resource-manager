// app/components/resource/ConfirmBookingDialog.jsx
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CircleCheck, Clock, Calendar, ArrowRight, Edit3 } from "lucide-react";

const pad = (n) => String(n).padStart(2, "0");

// Add 1 hour to a slot key to get the END boundary
const addOneHour = (date, hour) => {
  const nextHour = hour + 1;

  if (nextHour >= 24) {
    // Day rollover: 23:00 → next day 00:00
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const nextDate = d.toISOString().split("T")[0];
    return { d: nextDate, h: 0 };
  }

  return { d: date, h: nextHour };
};

const computeDisplayRange = (startKey, endKey) => {
  if (!startKey) return { start: null, end: null, minutes: 0 };

  const [sd, shStr] = startKey.split("_");
  const sh = parseInt(shStr, 10);

  // Determine the actual end slot
  let endSlot;
  if (!endKey) {
    // Single slot selection: use start slot
    endSlot = { d: sd, h: sh };
  } else {
    const [ed, ehStr] = endKey.split("_");
    const eh = parseInt(ehStr, 10);
    endSlot = { d: ed, h: eh };
  }

  // CRITICAL: Add 1 hour to end slot to get the END BOUNDARY time
  // Example: slot "16" (4pm-5pm) → display end time as 17:00 (5pm)
  const endBoundary = addOneHour(endSlot.d, endSlot.h);

  const sDate = new Date(`${sd}T${pad(sh)}:00:00`);
  const eDate = new Date(`${endBoundary.d}T${pad(endBoundary.h)}:00:00`);
  const minutes = Math.max(60, Math.round((eDate - sDate) / 60000));

  return {
    start: { d: sd, h: sh },
    end: endBoundary, // Use boundary time for display
    minutes,
  };
};

const fmtDate = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const DateChip = ({ label, d, h }) => {
  if (!d)
    return (
      <div className="group inline-flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
        <Calendar className="h-4 w-4" />
        <span>{label}</span>
        <span className="ml-1">—</span>
      </div>
    );
  const dateStr = fmtDate(d);
  const timeStr = `${pad(h)}:00`;
  return (
    <div className="group inline-flex items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Calendar className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tabular-nums">{timeStr}</span>
          <span className="text-xs text-muted-foreground">• {dateStr}</span>
        </div>
      </div>
    </div>
  );
};

export function ConfirmBookingDialog({
  open,
  onOpenChange,
  resourceName,
  actualStart,
  actualEnd,
  duration,
  purpose,
  onPurposeChange,
  onSubmit,
  onChangeTime,
  submitting = false,
}) {
  const { start, end } = useMemo(
    () => computeDisplayRange(actualStart, actualEnd),
    [actualStart, actualEnd]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card text-card-foreground border border-border">
        <DialogHeader className="px-6 gap-1 pt-4">
          <DialogTitle className="text-xl">Review your request</DialogTitle>
          <DialogDescription>
            Confirm the details before submitting for admin approval.
          </DialogDescription>
        </DialogHeader>

        <div className="border-t p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  Selected Resource
                </div>
                <div className="text-base font-medium">
                  {resourceName || "—"}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <DateChip label="Start" d={start?.d} h={start?.h} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <DateChip label="End" d={end?.d} h={end?.h} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      Duration: {duration?.formatted}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      onChangeTime?.();
                      onOpenChange?.(false);
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                    Change time
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">
                Purpose
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="purpose"
                placeholder="Describe the purpose..."
                value={purpose}
                onChange={(e) => onPurposeChange?.(e.target.value)}
                className="min-h-20 mt-2 border-border bg-background text-foreground dark:placeholder:text-muted-foreground/60"
              />

              <p className="text-xs text-muted-foreground">
                Provide a clear academic justification.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 dark:bg-muted/20 p-4">
              <div className="font-medium mb-2">Request Guidelines</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Requests are subject to admin approval.</li>
                <li>Email notification will be sent after processing.</li>
                <li>Purpose should clearly justify the usage.</li>
                <li>Resources are for academic use only.</li>
                <li>Late cancellations may affect future approvals.</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={submitting || !purpose?.trim()}
            onClick={onSubmit}
          >
            <CircleCheck className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
