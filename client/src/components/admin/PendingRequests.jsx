import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, User, Clock, CheckCircle, XCircle } from "lucide-react";
import api from "@/api/axios";
import PageTitle from "../common/PageTitle";
import useAuth from "@/hooks/useAuth";
import StatusBadge from "../common/StatusBadge";
import ConfirmDialog from "../common/ConfirmDialog";
import DashboardStats from "../common/DashboardStats";
import { StatusFilter } from "../common/StatusFilter";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

/* -------------------------------------------------------------------------- */
/*                               Helper functions                             */
/* -------------------------------------------------------------------------- */
const fmtDateTime = (iso) => format(new Date(iso), "dd MMM yyyy, HH:mm");

const STATUS_LABEL = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/* -------------------------------------------------------------------------- */
/*                            Pending Requests Page                           */
/* -------------------------------------------------------------------------- */
export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    requestId: null,
    action: "",
  });
  const [remark, setRemark] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  /* ---------------------------- Fetch Data ---------------------------- */
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/requests/pending");
      const data = res.data.data || [];
      setRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /* ---------------------------- Stats for dashboard ---------------------------- */
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

  /* ---------------------------- Search & Filter ---------------------------- */
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

  /* ---------------------------- Approve / Reject ---------------------------- */
  const handleDecision = async (id, nextStatus, remark = "") => {
    try {
      setDialogLoading(true);
      const endpoint =
        nextStatus === "approved"
          ? `/requests/${id}/approve`
          : `/requests/${id}/reject`;

      await api.patch(endpoint, { remark });
      await fetchRequests();
      setDialog({ open: false, requestId: null, action: "" });
      setRemark("");
    } catch (err) {
      console.error(`Failed to ${nextStatus} request ${id}`, err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleOpenDialog = (id, action) => {
    setDialog({ open: true, requestId: id, action });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageTitle
        title="Pending Requests"
        subtitle="Review and manage resource allocation requests"
      />

      {/* Dashboard summary */}
      <DashboardStats stats={dashboardStats} layout="responsive" />

      {/* Search + Filter Row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by resource, status, or purpose..."
            className={cn("pl-9 placeholder:text-muted-foreground/80")}
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

      {/* Requests List */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading requests...</p>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filtered.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              onDecision={handleOpenDialog}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No pending requests found.
        </p>
      )}

      {refreshing && (
        <p className="text-xs text-primary mt-4 italic animate-pulse">
          Updating request list...
        </p>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog({ ...dialog, open: v })}
        title={
          dialog.action === "approved" ? "Approve Request" : "Reject Request"
        }
        description={
          dialog.action === "approved"
            ? "Are you sure you want to approve this booking request?"
            : "Please confirm rejection and optionally add a remark."
        }
        onConfirm={() =>
          handleDecision(dialog.requestId, dialog.action, remark)
        }
        loading={dialogLoading}
        confirmText={dialog.action === "approved" ? "Approve" : "Reject"}
        variant={dialog.action === "approved" ? "default" : "destructive"}
      >
        {dialog.action === "rejected" && (
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Add remarks for rejection (optional)"
            className="w-full mt-3 p-2 border rounded-md text-sm bg-background"
          />
        )}
      </ConfirmDialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Request Card                                 */
/* -------------------------------------------------------------------------- */
function RequestCard({ request, onDecision }) {
  const { user } = useAuth();
  const isDeptAdmin =
    user?.role === "admin" &&
    user?.department === request?.resourceId?.department;

  return (
    <Card className="bg-card text-card-foreground">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 w-full">
            <h2 className="text-lg font-semibold whitespace-nowrap">
              {request.resourceId?.name}
            </h2>

            <div className="flex justify-between items-center w-full mt-1 sm:mt-0">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs font-medium">
                  {request.resourceId?.type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {request.resourceId?.department}
                </Badge>
              </div>

              <StatusBadge status={request.status} />
            </div>
          </div>
        </div>

        {/* Requester Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
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

        {/* Purpose */}
        <div className="mb-5">
          <p className="text-sm text-muted-foreground font-medium mb-1.5">
            Purpose
          </p>
          <div className="bg-muted text-foreground px-3 py-2 rounded-md text-sm">
            {request.purpose || "No purpose provided."}
          </div>
        </div>

        {/* Action Buttons */}
        {request?.status === "pending" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              disabled={!isDeptAdmin}
              variant="outline"
              className={`flex-1 ${
                isDeptAdmin
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => isDeptAdmin && onDecision(request._id, "approved")}
            >
              ✓ Approve
            </Button>
            <Button
              disabled={!isDeptAdmin}
              variant="outline"
              className={`flex-1 ${
                isDeptAdmin
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => isDeptAdmin && onDecision(request._id, "rejected")}
            >
              ✗ Reject
            </Button>
          </div>
        )}

        {!isDeptAdmin && request?.status === "pending" && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            You can view this request but cannot approve/reject — it belongs to
            another department.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
