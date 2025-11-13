import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  User,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
} from "lucide-react";
import api from "@/api/axios";
import PageTitle from "../common/PageTitle";
import useAuth from "@/hooks/useAuth";
import StatusBadge from "../common/StatusBadge";
import ConfirmDialog from "../common/ConfirmDialog";
import DashboardStats from "../common/DashboardStats";
import { StatusFilter } from "../common/StatusFilter";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "../ui/separator";

const fmtDateTime = (iso) => format(new Date(iso), "dd MMM yyyy, HH:mm");

const STATUS_LABEL = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    requestId: null,
    remark: "",
    loading: false,
  });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/requests/pending");
      setRequests(res.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const stats = useMemo(() => {
    const base = { all: requests.length, pending: 0, approved: 0, rejected: 0 };
    for (const r of requests) {
      const s = r.status?.toLowerCase();
      if (base[s] !== undefined) base[s] += 1;
    }
    return base;
  }, [requests]);

  const dashboardStats = [
    {
      label: "Pending Requests",
      value: stats.pending,
      icon: <Clock className="w-4 h-4 text-yellow-500" />,
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: <XCircle className="w-4 h-4 text-red-500" />,
    },
  ];

  const searched = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) =>
      [
        r._id,
        r.purpose,
        r.status,
        r.resourceId?.name,
        r.resourceId?.type,
        r.resourceId?.department,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [requests, q]);

  const filtered = useMemo(() => {
    return statusFilter === "all"
      ? searched
      : searched.filter((r) => r.status?.toLowerCase() === statusFilter);
  }, [searched, statusFilter]);

  const refreshList = async () => {
    try {
      const res = await api.get("/requests/pending");
      setRequests(res.data.data || []);
    } catch {}
  };

  const approveRequest = async (id) => {
    try {
      setActionLoading(id);
      await api.patch(`/requests/${id}/approve`, { remark: "" });
      await refreshList();
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (id) => {
    setRejectDialog({ open: true, requestId: id, remark: "", loading: false });
  };

  const submitRejection = async () => {
    const { requestId, remark } = rejectDialog;
    if (!remark.trim()) return;

    try {
      setRejectDialog((p) => ({ ...p, loading: true }));
      await api.patch(`/requests/${requestId}/reject`, { remark });
      setRejectDialog({
        open: false,
        requestId: null,
        remark: "",
        loading: false,
      });
      await refreshList();
    } finally {
      setRejectDialog((p) => ({ ...p, loading: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <PageTitle
          title="Pending Requests"
          subtitle="Review and manage resource allocation requests"
        />

        <div className="hidden sm:grid grid-cols-3 gap-4 mb-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border bg-card p-4">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-7 w-10" />
            </Card>
          ))}
        </div>

        <div className="sm:hidden p-3 bg-card border rounded-lg space-y-2 animate-pulse mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4 animate-pulse">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="flex flex-col gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageTitle
        title="Pending Requests"
        subtitle="Review and manage resource allocation requests"
      />

      <DashboardStats stats={dashboardStats} layout="responsive" />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by resource, status or purpose..."
            className={cn("pl-9")}
          />
        </div>

        <StatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={["all", "pending", "approved", "rejected"]}
          stats={stats}
          labels={STATUS_LABEL}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filtered.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              approveRequest={approveRequest}
              openRejectDialog={openRejectDialog}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No pending requests found.
        </p>
      )}

      <ConfirmDialog
        open={rejectDialog.open}
        onOpenChange={(v) => setRejectDialog((p) => ({ ...p, open: v }))}
        title="Reject Request"
        description="Provide a remark before rejecting this request."
        onConfirm={submitRejection}
        loading={rejectDialog.loading}
        confirmText="Reject"
        variant="destructive"
      >
        <textarea
          value={rejectDialog.remark}
          onChange={(e) =>
            setRejectDialog((p) => ({ ...p, remark: e.target.value }))
          }
          placeholder="Enter rejection remark..."
          className="w-full mt-3 p-2 border rounded-md text-sm bg-background"
        />
      </ConfirmDialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Request Card                                 */
/* -------------------------------------------------------------------------- */

function RequestCard({
  request,
  approveRequest,
  openRejectDialog,
  actionLoading,
}) {
  const { user } = useAuth();
  const isDeptAdmin =
    user?.role === "admin" &&
    user?.department === request?.resourceId?.department;

  return (
    <Card className="bg-card text-card-foreground border">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 w-full">
            <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">
              {request.resourceId?.name || "Resource"}
            </h2>

            <div className="flex justify-between items-center w-full mt-1 sm:mt-0">
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-medium capitalize bg-background border-border text-muted-foreground"
                >
                  {request.resourceId?.type || "resource"}
                </Badge>

                <Badge variant="secondary" className="text-xs capitalize">
                  {request.resourceId?.department || "Dept"}
                </Badge>
              </div>

              <div className="flex items-center">
                <StatusBadge status={request.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Location + Request date */}
        <div className="flex flex-col sm:flex-row sm:justify-between mt-1 text-xs text-muted-foreground">
          {request.resourceId?.location ? (
            <div className="flex items-center">
              <MapPin className="inline h-3 w-3 mr-1 mt-px" />
              <span>{request.resourceId.location}</span>
            </div>
          ) : (
            <span />
          )}
          <span className="mt-1 sm:mt-0">
            Request Date:{" "}
            {format(new Date(request.createdAt), "dd-MM-yyyy HH:mm")}
          </span>
        </div>

        <Separator className="my-3 border-border" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4">
          <div className="flex items-start gap-2">
            <User className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-medium">
                {request.userId?.username ||
                  request.requester?.name ||
                  "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.userId?.email || request.email}
              </p>
              <Badge variant="secondary" className="text-xs mt-1 -ml-2">
                {request.userId?.role || request.requester?.role || "N/A"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 mt-3 sm:mt-0 text-sm">
            <span>
              From:{" "}
              <span className="font-medium">
                {fmtDateTime(request.startTime)}
              </span>
            </span>
            <span>
              To:{" "}
              <span className="font-medium">
                {fmtDateTime(request.endTime)}
              </span>
            </span>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm text-muted-foreground font-medium mb-1.5">
            Purpose
          </p>
          <div className="bg-muted text-foreground px-3 py-2 rounded-md text-sm">
            {request.purpose || "No purpose provided."}
          </div>
        </div>

        {/* Approve / Reject */}
        {request.status === "pending" && (
          <div className="flex gap-3">
            <Button
              disabled={!isDeptAdmin || actionLoading === request._id}
              variant="outline"
              className={cn(
                "flex-1",
                isDeptAdmin
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isDeptAdmin && approveRequest(request._id)}
            >
              {actionLoading === request._id ? "Approving..." : "✓ Approve"}
            </Button>

            <Button
              disabled={!isDeptAdmin}
              variant="outline"
              className={cn(
                "flex-1",
                isDeptAdmin
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isDeptAdmin && openRejectDialog(request._id)}
            >
              ✗ Reject
            </Button>
          </div>
        )}

        {!isDeptAdmin && request.status === "pending" && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            You cannot approve/reject — different department.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
