import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Clock3,
  CalendarDays,
  Info,
  X,
  CheckCircle2,
  Search,
  MapPin,
  ExternalLink,
} from "lucide-react";
import api from "@/api/axios";
import { format, isSameDay, differenceInHours } from "date-fns";

import PageTitle from "../common/PageTitle";
import { cn } from "@/lib/utils";
import { StatusFilter } from "../common/StatusFilter";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../common/ConfirmDialog";
import StatusBadge from "../common/StatusBadge";

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

const STATUS_LABEL = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
};

const fmtDayCompact = (iso) => format(new Date(iso), "yyyy-MM-dd");
const fmtNiceDay = (iso) => format(new Date(iso), "do MMMM, yy");
const fmtNiceTime = (iso) => format(new Date(iso), "HH:mm");
const hoursBetween = (a, b) =>
  Math.max(1, differenceInHours(new Date(b), new Date(a)));

/* -------------------------------------------------------------------------- */
/*                                  component                                 */
/* -------------------------------------------------------------------------- */

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // confirmation dialog state
  const [confirmId, setConfirmId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/requests/my`);
        const data = res?.data?.requests ?? [];
        if (mounted) setRequests(data);
      } catch (e) {
        console.error("Failed to load requests", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const base = {
      all: requests.length,
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
    };
    for (const r of requests) {
      const s = r.status?.toLowerCase();
      if (s && base[s] !== undefined) base[s] += 1;
    }
    return base;
  }, [requests]);

  const searched = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) => {
      const { resource = {} } = r;
      return [
        r._id,
        r.purpose,
        r.status,
        resource.name,
        resource.type,
        resource.location,
        fmtNiceDay(r.startTime),
        fmtNiceDay(r.endTime),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [requests, q]);

  const filtered = useMemo(() => {
    return statusFilter === "all"
      ? searched
      : searched.filter((r) => r.status?.toLowerCase() === statusFilter);
  }, [searched, statusFilter]);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await api.patch(`/requests/${id}/cancel`);
      setRequests((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: "rejected", remarks: "Cancelled by requester" }
            : r
        )
      );
    } catch (e) {
      console.error("Cancel failed", e);
    } finally {
      setCancelling(null);
      setShowConfirm(false);
    }
  };

  const SkeletonRequestLoader = () => {
    return (
      <Card className="border border-border bg-card text-card-foreground animate-pulse">
        <CardContent className="p-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 w-full">
              <div className="h-5 w-40 bg-muted rounded"></div>

              <div className="flex justify-between items-center w-full mt-2 sm:mt-0">
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-muted rounded"></div>
                  <div className="h-5 w-16 bg-muted rounded"></div>
                </div>

                <div className="h-5 w-20 bg-muted rounded"></div>
              </div>
            </div>
          </div>

          {/* Location + Request Date Row */}
          <div className="flex flex-col sm:flex-row sm:justify-between mt-2 text-xs">
            <div className="h-4 w-28 bg-muted rounded"></div>
            <div className="h-4 w-24 bg-muted rounded mt-2 sm:mt-0"></div>
          </div>

          <Separator className="my-3" />

          {/* Date & Times */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 bg-muted rounded"></div>

              <div className="space-y-2">
                <div className="h-4 w-48 bg-muted rounded"></div>
                <div className="h-4 w-20 bg-muted rounded"></div>
              </div>
            </div>

            <div className="flex gap-2 sm:items-end">
              <div className="h-9 w-20 bg-muted rounded"></div>
              <div className="h-9 w-20 bg-muted rounded"></div>
            </div>
          </div>

          {/* Purpose */}
          <div className="mt-4">
            <div className="h-4 w-20 bg-muted rounded mb-2"></div>
            <div className="h-10 w-full bg-muted rounded"></div>
          </div>

          {/* Footer buttons */}
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between gap-3">
            <div className="h-4 w-40 bg-muted rounded"></div>

            <div className="flex gap-2">
              <div className="h-8 w-20 bg-muted rounded"></div>
              <div className="h-8 w-24 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground ">
      <PageTitle
        title="My Requests"
        subtitle="Track and manage your resource bookings"
      />

      {/* Search + Filter row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by resource, status, purpose, location or ID…"
            className={cn(
              "pl-9",
              "placeholder:text-muted-foreground/80",
              "placeholder:text-sm",
              "bg-background text-foreground"
            )}
          />
        </div>

        <StatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={["all", "pending", "approved", "completed", "rejected"]}
          stats={stats}
          labels={STATUS_LABEL}
        />
      </div>

      {/* Results */}
      <div className="mt-2">
        {loading ? (
          <div className="flex flex-col gap-6">
            {/* Repeat 3 skeleton cards */}
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRequestLoader key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((req) => (
              <RequestCard
                key={req._id}
                req={req}
                onOpenConfirm={(id) => {
                  setConfirmId(id);
                  setShowConfirm(true);
                }}
                cancelling={cancelling === req._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Cancel Booking?"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
        variant="destructive"
        onConfirm={() => confirmId && handleCancel(confirmId)}
        loading={!!cancelling}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Empty State                                 */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="rounded-md border border-border border-dashed p-8 text-center bg-card text-card-foreground">
      <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-foreground font-medium">No requests to show</p>
      <p className="text-muted-foreground text-sm">
        Adjust your filters or try a different search
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Request Card                                 */
/* -------------------------------------------------------------------------- */

function RequestCard({ req, onOpenConfirm, cancelling }) {
  const navigate = useNavigate();
  const status = req.status?.toLowerCase();
  const resource = req.resource || {};

  const sameDay = isSameDay(new Date(req.startTime), new Date(req.endTime));
  const datePrimary = sameDay
    ? fmtNiceDay(req.startTime)
    : `${fmtNiceDay(req.startTime)} → ${fmtNiceDay(req.endTime)}`;
  const totalHours =
    req.durationHours ?? hoursBetween(req.startTime, req.endTime);

  const formatDuration = (hours) => {
    if (hours <= 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  return (
    <Card className="border border-border bg-card text-card-foreground">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 w-full">
            <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">
              {resource.name || "Resource"}
            </h2>

            <div className="flex justify-between items-center w-full mt-1 sm:mt-0">
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-medium capitalize bg-background border-border text-muted-foreground"
                >
                  {resource.type || "resource"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs bg-muted border-border text-muted-foreground"
                >
                  {formatDuration(totalHours)}
                </Badge>
              </div>

              <div className="flex items-center">
                <StatusBadge status={status} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between mt-1 text-xs text-muted-foreground">
          {/* Location (top on mobile, left on desktop) */}
          {req?.resource?.location ? (
            <div className="flex items-center">
              <MapPin className="inline h-3 w-3 mr-1 mt-px" />
              <span>{req.resource.location}</span>
            </div>
          ) : (
            <span />
          )}

          {/* Request date (bottom on mobile, right on desktop) */}
          <span className="mt-1 sm:mt-0">
            Request Date: {format(new Date(req.createdAt), "dd-MM-yyyy HH:mm")}
          </span>
        </div>

        <Separator className="my-3 border-border" />

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex gap-2 items-center">
                <div className="text-foreground font-medium">{datePrimary}</div>
                {!sameDay && (
                  <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                    Multi-day
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
              <span className="text-xs text-muted-foreground">Start</span>
              <span className="text-sm font-medium text-foreground">
                {fmtNiceTime(req.startTime)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
              <span className="text-xs text-muted-foreground">End</span>
              <span className="text-sm font-medium text-foreground">
                {fmtNiceTime(req.endTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground font-medium mb-1.5">
            Purpose
          </p>
          <div className="bg-muted px-3 py-2 rounded-md text-sm text-foreground">
            {req.purpose || "No purpose provided."}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            {status === "approved" && (
              <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approved on{" "}
                {req.approvedAt ? fmtDayCompact(req.approvedAt) : "—"}
              </div>
            )}
            {status === "completed" && (
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                <Clock3 className="h-4 w-4 mr-2" />
                Completed on{" "}
                {req.completedAt ? fmtDayCompact(req.completedAt) : "—"}
              </div>
            )}
            {status === "rejected" && (
              <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                <X className="h-4 w-4 mr-2" />
                Rejected {req.remarks ? `– ${req.remarks}` : ""}
              </div>
            )}
          </div>

          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="outline"
              size="xs"
              disabled={cancelling}
              onClick={() => onOpenConfirm(req._id)}
              className={cn(
                "transition-all duration-200 px-4 py-1",
                "border-destructive text-destructive hover:bg-destructive/10"
              )}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Cancelling…
                </>
              ) : (
                <>
                  Cancel
                  <X className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="xs"
              className="transition-all duration-200 px-4 py-1 border-border text-foreground hover:bg-muted"
              onClick={() => navigate(`/requests/${req._id}`)}
            >
              View Details
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
