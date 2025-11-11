import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import api from "@/api/axios";
import PageTitle from "../common/PageTitle";
import useAuth from "@/hooks/useAuth";

export default function PendingRequests() {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/requests/pending");
      const data = res.data.data || [];
      setRequests(data);
      setStats({
        pending: data.filter((r) => r.status?.toLowerCase() === "pending")
          .length,
        approved: data.filter((r) => r.status?.toLowerCase() === "approved")
          .length,
        rejected: data.filter((r) => r.status?.toLowerCase() === "rejected")
          .length,
      });
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

  const handleDecision = async (id, nextStatus) => {
    let remark = "";
    if (nextStatus === "rejected") {
      const input = window.prompt("Add remarks for rejection (optional):", "");
      if (input !== null) remark = input.trim();
    }

    try {
      setRefreshing(true);
      const endpoint =
        nextStatus === "approved"
          ? `/requests/${id}/approve`
          : `/requests/${id}/reject`;
      await api.patch(endpoint, { remark });

      // ✅ Refetch from backend to ensure up-to-date data
      await fetchRequests();
    } catch (err) {
      console.error(`Failed to ${nextStatus} request ${id}`, err);
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PageTitle
        title="Pending Requests"
        subtitle="Review and manage resource allocation requests"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Pending Requests" value={stats.pending} />
        <StatCard title="Approved" value={stats.approved} />
        <StatCard title="Rejected" value={stats.rejected} />
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading requests...</p>
      ) : requests.length > 0 ? (
        <div className="flex flex-col gap-6">
          {requests.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              onDecision={handleDecision}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No pending requests found.</p>
      )}

      {refreshing && (
        <p className="text-xs text-blue-500 mt-4 italic animate-pulse">
          Updating request list...
        </p>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <Card className="p-4 shadow-sm border border-gray-200">
      <div className="text-gray-500 text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </Card>
  );
}

function RequestCard({ request, onDecision }) {
  const { user } = useAuth();
  const isDeptAdmin =
    user?.role === "admin" &&
    user?.department === request?.resourceId?.department;

  const status =
    request.status?.charAt(0).toUpperCase() + request.status?.slice(1);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3 items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {request.resourceId?.name}
            </h2>
            <Badge variant="outline" className="text-xs font-medium">
              {request.resourceId?.type}
            </Badge>
            <Badge className="text-xs bg-gray-100 text-gray-700">
              {request.resourceId?.department}
            </Badge>
          </div>
          <Badge
            className={
              status === "Pending"
                ? "bg-yellow-100 text-yellow-700"
                : status === "Approved"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }
          >
            {status}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-start gap-2">
            <User className="w-5 h-5 text-gray-500 mt-1" />
            <div>
              <p className="font-medium text-gray-900">
                {request.userId?.username ||
                  request.requester?.name ||
                  "Unknown"}
              </p>
              <p className="text-sm text-gray-500">
                {request.userId?.email || request.email}
              </p>
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-700 text-xs mt-1 -ml-2"
              >
                {request.userId?.role ||
                  request.role ||
                  request.requester?.role ||
                  "N/A"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 mt-3 sm:mt-0 text-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <span>
                From:{" "}
                <span className="font-medium">
                  {request.startTime
                    ? `${new Date(request.startTime).toLocaleDateString(
                        undefined,
                        { dateStyle: "medium" }
                      )} ${new Date(request.startTime).toLocaleTimeString(
                        undefined,
                        { hour: "2-digit", minute: "2-digit", hour12: false }
                      )}`
                    : "N/A"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                To:{" "}
                <span className="font-medium">
                  {request.endTime
                    ? `${new Date(request.endTime).toLocaleDateString(
                        undefined,
                        { dateStyle: "medium" }
                      )} ${new Date(request.endTime).toLocaleTimeString(
                        undefined,
                        { hour: "2-digit", minute: "2-digit", hour12: false }
                      )}`
                    : "N/A"}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm text-gray-500 font-medium mb-1.5">Purpose</p>
          <div className="bg-gray-50 text-gray-800 px-3 py-2 rounded-md text-sm">
            {request.purpose || "No purpose provided."}
          </div>
        </div>

        {status === "Pending" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              disabled={!isDeptAdmin}
              variant="outline"
              className={`flex-1 ${
                isDeptAdmin
                  ? "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
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
                  ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => isDeptAdmin && onDecision(request._id, "rejected")}
            >
              ✗ Reject
            </Button>
          </div>
        )}
        {!isDeptAdmin && status === "Pending" && (
          <p className="text-xs text-gray-500 mt-2 italic">
            You can view this request but cannot approve/reject — it belongs to
            another department.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
