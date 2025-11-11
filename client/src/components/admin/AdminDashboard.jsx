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
import LoadingPage from "../common/LoadingPage";

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

  if (loading) return <LoadingPage />;
  if (!stats || !stats.success)
    return <div className="p-8">Failed to load dashboard</div>;

  const d = stats.stats;
  const pendingList = stats.pendingRequests ?? [];
  const activityList = stats.recentActivity ?? [];

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 flex flex-col">
        {/* Header */}
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
                <span className="text-gray-600 text-xs flex items-center gap-1 -my-1">
                  <span className="font-bold text-orange-500 text-xl">
                    {d.deptResources}
                  </span>
                  <span className="mt-[3px]">belong to {d.department}</span>
                </span>
              ),
              icon: <Server className="w-5 h-5 text-gray-500" />,
            },
            {
              label: "Available",
              value: d.availableResources,
              subtitle: (
                <span className="text-gray-600 text-xs flex items-center gap-1 -my-1">
                  <span className="font-bold text-purple-500 text-xl">
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
              icon: <Users className="w-5 h-5 text-gray-500" />,
            },
          ]}
        />

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending Requests */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold mb-0">
                Pending Requests
              </CardTitle>
              <p className="text-sm text-gray-500">
                Requests awaiting your approval (FIFO)
              </p>
            </CardHeader>
            <CardContent>
              {pendingList.length === 0 && (
                <div className="text-gray-500 py-2">No pending requests.</div>
              )}
              {pendingList.map((req, i) => (
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
              ))}
              <Button
                variant="link"
                className="px-0 mt-2 text-blue-600"
                onClick={() => navigate("/admin/requests")}
              >
                View All Requests
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold mb-0">
                Recent Activity
              </CardTitle>
              <p className="text-sm text-gray-500">Latest system activity</p>
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
        <DialogContent className="sm:max-w-md">
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
              className="bg-red-600 hover:bg-red-700 text-white"
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
      className="flex items-center justify-between border-b last:border-b-0 py-3 px-2 rounded-md cursor-pointer transition-all hover:bg-gray-50 hover:shadow-sm"
    >
      <div>
        <span className="font-medium text-gray-800">{name}</span>
        <div className="text-xs text-gray-500">
          {resource} • {date} • {duration}
        </div>
      </div>

      <div
        className="flex gap-2"
        onClick={(e) => e.stopPropagation()} // Prevent parent click
      >
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
      : "text-gray-400";
  return (
    <div className="border border-gray-200 rounded-md p-3 mb-3 last:mb-0 flex items-start gap-3 bg-white">
      <span
        className={`w-2 h-2 rounded-full block ${iconColor} mt-1.5 shrink`}
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-900">{action}</span>
        <span className="text-sm text-gray-500">
          {user && `${user} •`} {detail} • {ago}
        </span>
      </div>
    </div>
  );
}
