"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import api from "@/api/axios";

export default function PendingRequests() {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
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
      }
    };
    fetchRequests();
  }, []);

  const adjustStats = (prev, from, to) => {
    const next = { ...prev };
    next[from] = Math.max(0, next[from] - 1);
    next[to] = next[to] + 1;
    return next;
  };

  const handleDecision = async (id, nextStatus) => {
    let remarks = "";
    if (nextStatus === "rejected") {
      const input = window.prompt("Add remarks for rejection (optional):", "");
      if (input !== null) remarks = input.trim();
    }

    const current = requests.find((r) => r._id === id);
    if (!current) return;

    const prevStatus = current.status;
    setRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: nextStatus } : r))
    );
    setStats((prev) => adjustStats(prev, prevStatus, nextStatus));

    try {
      await api.patch(`/requests/${id}/decision`, {
        status: nextStatus,
        ...(nextStatus === "rejected" ? { remarks } : {}),
      });
    } catch (err) {
      console.error(
        `Failed to set status=${nextStatus} for request ${id}`,
        err
      );
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: prevStatus } : r))
      );
      setStats((prev) => adjustStats(prev, nextStatus, prevStatus));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Requests</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and manage resource allocation requests
        </p>
      </div>

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
  const status =
    request.status?.charAt(0).toUpperCase() + request.status?.slice(1);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3 items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {request.resourceId?.name || request.resourceName}
            </h2>
            <Badge variant="outline" className="text-xs font-medium">
              {request.resourceId?.type || request.resourceType}
            </Badge>
          </div>
          <Badge
            className={
              status === "pending"
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                : status === "approved"
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
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
                        {
                          dateStyle: "medium",
                        }
                      )} ${new Date(request.startTime).toLocaleTimeString(
                        undefined,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }
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
                        {
                          dateStyle: "medium",
                        }
                      )} ${new Date(request.endTime).toLocaleTimeString(
                        undefined,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }
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
              variant="outline"
              className="bg-blue-100 text-blue-700 border-blue-300 flex-1 hover:bg-blue-200"
              onClick={() => onDecision(request._id, "approved")}
            >
              ✓ Approve
            </Button>
            <Button
              variant="outline"
              className="bg-red-100 text-red-700 border-red-300 flex-1 hover:bg-red-200"
              onClick={() => onDecision(request._id, "rejected")}
            >
              ✗ Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
