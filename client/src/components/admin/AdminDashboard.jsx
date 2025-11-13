import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Server, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import api from "@/api/axios";
import { timeAgo } from "@/utils/dateUtils";
import DashboardStats from "../common/DashboardStats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import PageTitle from "../common/PageTitle";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const navigate = useNavigate();

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/admin");
      setStats(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  async function handleApprove(id) {
    try {
      setRefreshing(true);
      const res = await api.patch(`/requests/${id}/approve`, {
        remarks: "Approved automatically by system",
      });
      if (res.data.success) {
        toast.success("Request approved successfully");
        await fetchStats();
      } else toast.error(res.data.message || "Failed to approve");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error approving request");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRejectConfirm() {
    if (!remarks.trim()) {
      toast.error("Remarks are required to reject a request");
      return;
    }
    try {
      setRefreshing(true);
      const res = await api.patch(`/requests/${selectedId}/reject`, {
        remarks,
      });
      if (res.data.success) {
        toast.success("Request rejected successfully");
        setRejectModal(false);
        setRemarks("");
        await fetchStats();
      } else toast.error(res.data.message || "Failed to reject");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error rejecting request");
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background text-foreground">
        <main className="flex-1 flex flex-col space-y-4">
          <PageTitle
            title="Admin Dashboard"
            subtitle="Resource management and system overview"
          />

          {/* Stats Skeleton */}
          <div className="hidden sm:grid grid-cols-4 gap-4 mb-5 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile Stats */}
          <div className="sm:hidden space-y-2 mb-5 p-3 rounded-lg shadow border border-border bg-card animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>

          {/* Pending + Activity Skeleton Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pending Requests Skeleton */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-52" />
              </CardHeader>
              <CardContent className="space-y-4 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="py-3 border-b border-border">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                ))}
                <Skeleton className="h-10 w-36" />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-36 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-md p-3 border border-border">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Null-safe access after loading
  const d = stats?.stats || {};
  const pendingList = stats?.pendingRequests || [];
  const activityList = stats?.recentActivity || [];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <main className="flex-1 flex flex-col space-y-4">
        <PageTitle
          title="Admin Dashboard"
          subtitle="Resource management and system overview"
        />

        {/* Stats */}
        <DashboardStats
          stats={[
            {
              label: "Total Resources",
              value: d.totalResources,
              subtitle: (
                <span className="text-muted-foreground text-xs flex items-center gap-1 -my-1">
                  <span className="font-bold text-primary text-xl">
                    {d.deptResources}
                  </span>
                  <span className="mt-[3px]">belong to {d.department}</span>
                </span>
              ),
              icon: <Server className="w-5 h-5 text-muted-foreground" />,
            },
            {
              label: "Available",
              value: d.availableResources,
              subtitle: (
                <span className="text-muted-foreground text-xs flex items-center gap-1 -my-1">
                  <span className="font-bold text-green-500 text-xl">
                    {d.availableDeptResources}
                  </span>
                  <span className="mt-[3px]">available in {d.department}</span>
                </span>
              ),
              icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            },
            {
              label: "Pending Requests",
              value: d.pendingRequests,
              subtitle: "Need review",
              icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
            },
            {
              label: "Total Users",
              value: d.totalUsers,
              subtitle: "Active accounts",
              icon: <Users className="w-5 h-5 text-muted-foreground" />,
            },
          ]}
        />

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending Requests */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold mb-0">
                Pending Requests
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Requests awaiting your approval (FIFO)
              </p>
            </CardHeader>

            <CardContent>
              {pendingList.length === 0 ? (
                <div className="text-muted-foreground py-2">
                  No pending requests.
                </div>
              ) : (
                pendingList.map((req, i) => (
                  <PendingRequest
                    key={req._id || i}
                    id={req._id}
                    name={req.userId?.username || "Unknown"}
                    resource={req.resourceId?.name || ""}
                    date={req.startTime?.slice(0, 10)}
                    duration={req.duration ? `${req.duration}h` : ""}
                    onApprove={() => handleApprove(req._id)}
                    onReject={() => {
                      setSelectedId(req._id);
                      setRejectModal(true);
                    }}
                    loading={refreshing}
                  />
                ))
              )}

              <Button
                variant="link"
                className="px-0 mt-2 text-primary hover:underline"
                onClick={() => navigate("/admin/requests")}
              >
                View All Requests
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold mb-0">
                Recent Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest system activity
              </p>
            </CardHeader>

            <CardContent>
              {activityList.map((act, i) => (
                <ActivityItem
                  key={act._id || i}
                  type={act.status || ""}
                  user={act.userId?.username || ""}
                  action={
                    act.status === "approved"
                      ? "Request approved"
                      : act.status === "pending"
                      ? "Request created"
                      : act.status === "rejected"
                      ? "Request rejected"
                      : "Activity"
                  }
                  detail={act.resourceId?.name || ""}
                  ago={timeAgo(act.updatedAt)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Reject Modal */}
      <Dialog open={rejectModal} onOpenChange={setRejectModal}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="remarks">Remarks *</Label>
            <Textarea
              id="remarks"
              placeholder="Enter reason for rejection..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectModal(false);
                setRemarks("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={refreshing || !remarks.trim()}
              className="bg-destructive text-destructive-foreground hover:opacity-90"
            >
              {refreshing ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PendingRequest({
  id,
  name,
  resource,
  date,
  duration,
  onApprove,
  onReject,
  loading,
}) {
  const navigate = useNavigate();

  function handleNavigate() {
    navigate(`/admin/requests/${id}`);
  }

  return (
    <div
      onClick={handleNavigate}
      className="flex items-center justify-between border-b border-border last:border-b-0 py-3 px-2 rounded-md cursor-pointer transition-all hover:bg-muted/40"
    >
      <div>
        <span className="font-medium text-foreground">{name}</span>
        <div className="text-xs text-muted-foreground">
          {resource} • {date} • {duration}
        </div>
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-7 w-7"
                variant="outline"
                onClick={onApprove}
                disabled={loading}
              >
                <CheckCircle className="text-green-500 w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Approve request</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-7 w-7"
                variant="outline"
                onClick={onReject}
                disabled={loading}
              >
                <XCircle className="text-red-500 w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reject request</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

function ActivityItem({ type, action, user, detail, ago }) {
  const iconColor =
    type === "approved"
      ? "text-blue-500"
      : type === "added"
      ? "text-green-500"
      : type === "rejected"
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <div className="border border-border rounded-md p-3 mb-3 last:mb-0 flex items-start gap-3 bg-card text-card-foreground">
      <span
        className={`w-2 h-2 rounded-full block ${iconColor} mt-1.5 shrink`}
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{action}</span>
        <span className="text-sm text-muted-foreground">
          {user && `${user} •`} {detail} • {ago}
        </span>
      </div>
    </div>
  );
}
