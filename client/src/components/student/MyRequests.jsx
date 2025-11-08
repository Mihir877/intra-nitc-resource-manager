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
  Filter,
  MapPin,
} from "lucide-react";
import api from "@/api/axios";
import { format, isSameDay, differenceInHours } from "date-fns";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageTitle from "../common/PageTitle";
import { cn } from "@/lib/utils";
import { StatusFilter } from "../common/StatusFilter";

// Helpers
const STATUS_LABEL = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
};

const statusPill = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
    case "approved":
      return "bg-green-100 text-green-700 hover:bg-green-200";
    case "completed":
      return "bg-blue-100 text-blue-700 hover:bg-blue-200";
    case "rejected":
      return "bg-red-100 text-red-700 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-700 hover:bg-gray-200";
  }
};

// New formatters
const fmtDayCompact = (iso) => format(new Date(iso), "yyyy-MM-dd"); // request date
const fmtNiceDay = (iso) => format(new Date(iso), "do MMMM, yy"); // 7th Nov, 25
const fmtNiceTime = (iso) => format(new Date(iso), "HH:mm"); // 09:00
const hoursBetween = (a, b) =>
  Math.max(1, differenceInHours(new Date(b), new Date(a)));

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // new filter

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

  // text search across resource name, type, location, purpose, request id
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

  // apply status filter (replaces tab triggers)
  const filtered = useMemo(() => {
    const base =
      statusFilter === "all"
        ? searched
        : searched.filter((r) => r.status?.toLowerCase() === statusFilter);
    return base;
  }, [searched, statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this request?")) return;
    setCancelling(id);
    try {
      await api.post(`/requests/${id}/cancel`);
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
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PageTitle
        title="My Requests"
        subtitle="Track and manage your resource bookings"
      />

      {/* Search + Filter row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by resource, status, purpose, location or ID…"
            className={cn(
              "pl-9",
              "placeholder:text-gray-400/80",
              "placeholder:text-sm"
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
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading requests…</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((req) => (
              <RequestCard
                key={req._id}
                req={req}
                onCancel={handleCancel}
                cancelling={cancelling === req._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-gray-200 p-8 text-center">
      <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
        <Info className="h-5 w-5 text-gray-500" />
      </div>
      <p className="text-gray-900 font-medium">No requests to show</p>
      <p className="text-gray-500 text-sm">
        Adjust your filters or try a different search
      </p>
    </div>
  );
}

function RequestCard({ req, onCancel, cancelling }) {
  const status = req.status?.toLowerCase();
  const resource = req.resource || {};

  // Date/time labels
  const sameDay = isSameDay(new Date(req.startTime), new Date(req.endTime));
  const datePrimary = sameDay
    ? fmtNiceDay(req.startTime)
    : `${fmtNiceDay(req.startTime)} → ${fmtNiceDay(req.endTime)}`;
  const timePrimary = sameDay
    ? `${fmtNiceTime(req.startTime)} - ${fmtNiceTime(req.endTime)}`
    : `${fmtNiceTime(req.startTime)} → ${fmtNiceTime(req.endTime)}`;
  const totalHours =
    req.durationHours ?? hoursBetween(req.startTime, req.endTime);

  const formatDuration = (hours) => {
    if (hours <= 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        {/* Heading */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {resource.name || "Resource"}
            </h2>
            <Badge variant="outline" className="text-xs font-medium capitalize">
              {resource.type || "resource"}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-200">
              {formatDuration(totalHours)}
            </Badge>
          </div>
          <Badge className={statusPill(status)}>
            {STATUS_LABEL[status] || "Unknown"}
          </Badge>
        </div>

        {/* Sub header: location + Request Date */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          {req?.resource?.location ? (
            <div className="flex items-center">
              <MapPin className="inline h-3 w-3 mr-1 mt-px" />
              <span>{req.resource.location}</span>
            </div>
          ) : (
            <span />
          )}
          <span>Request Date: {fmtDayCompact(req.createdAt)}</span>
        </div>

        <Separator className="my-3" />

        {/* Details row */}
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          {/* Left: Dates and times grouped */}
          <div className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex gap-2">
                <div className="text-gray-900 font-medium">{datePrimary}</div>
                {!sameDay && (
                  <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                    Multi‑day
                  </span>
                )}
              </div>

              {/* <div
                className="text-sm text-gray-700"
                title={`${new Date(req.startTime).toISOString()} → ${new Date(
                  req.endTime
                ).toISOString()}`}
              >
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 ml-3 text-xs text-gray-700">
                  {totalHours}h
                </span>
              </div> */}
            </div>
          </div>

          {/* Right: Quick glance badges (start/end) */}
          <div className="flex  gap-2 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5">
              <span className="text-xs text-gray-500">Start</span>
              <span className="text-sm font-medium text-gray-900">
                {fmtNiceTime(req.startTime)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5">
              <span className="text-xs text-gray-500">End</span>
              <span className="text-sm font-medium text-gray-900">
                {fmtNiceTime(req.endTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Purpose section */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 font-medium mb-1.5">Purpose</p>
          <div className="bg-gray-50 text-gray-800 px-3 py-2 rounded-md text-sm">
            {req.purpose || "No purpose provided."}
          </div>
        </div>

        {/* Footer actions for pending */}
        {status === "pending" && (
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-gray-100 text-gray-800 hover:bg-gray-200"
              onClick={() => onCancel(req._id)}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Cancel Request
            </Button>
          </div>
        )}

        {/* Footer note for approved/completed */}
        {status === "approved" && (
          <div className="mt-4 flex items-center text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approved on {req.approvedAt ? fmtDayCompact(req.approvedAt) : "—"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
