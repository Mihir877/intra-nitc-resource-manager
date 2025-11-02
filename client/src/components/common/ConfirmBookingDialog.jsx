// app/components/resource/ConfirmBookingDialog.jsx
"use client";
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

const computeDisplayRange = (startKey, endKey) => {
  if (!startKey) return { start: null, end: null, minutes: 0 };
  const [sd, shStr] = startKey.split("_");
  const sh = parseInt(shStr, 10);
  let [ed, ehStr] = endKey ? endKey.split("_") : [sd, String(sh)];
  let eh = parseInt(ehStr, 10);
  if (!endKey || (sd === ed && eh === sh)) {
    ed = sd;
    eh = sh + 1;
  }
  const sDate = new Date(`${sd}T${pad(sh)}:00:00`);
  const eDate = new Date(`${ed}T${pad(eh)}:00:00`);
  const minutes = Math.max(60, Math.round((eDate - sDate) / 60000));
  return { start: { d: sd, h: sh }, end: { d: ed, h: eh }, minutes };
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
      <div className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
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
  duration, // optional upstream
  purpose,
  onPurposeChange,
  onSubmit,
  onChangeTime,
  submitting = false,
}) {
  const { start, end, minutes } = useMemo(
    () => computeDisplayRange(actualStart, actualEnd),
    [actualStart, actualEnd]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 gap-1 pt-4">
          <DialogTitle className="text-xl">Review your request</DialogTitle>
          <DialogDescription>
            Confirm the details before submitting for admin approval.
          </DialogDescription>
        </DialogHeader>

        <div className="border-t p-6 space-y-6 max-h-[70vh] overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                    <span className="font-medium">Duration: {duration?.formatted}</span>
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
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="Describe the purpose (e.g., Deep Learning training, Circuit Analysis)…"
                value={purpose}
                onChange={(e) => onPurposeChange?.(e.target.value)}
                className="min-h-20 mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Provide a clear academic justification.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4">
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
            className="gap-2"
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
