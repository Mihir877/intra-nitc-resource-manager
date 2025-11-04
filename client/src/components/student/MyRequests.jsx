// MyRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, FileText, X } from "lucide-react";
import api from "@/api/axios";
import { timeAgo } from "@/utils/dateUtils";

const tabs = ["All", "Pending", "Approved", "Completed", "Rejected"];

export default function MyRequests() {
  const [filter, setFilter] = useState("All");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", "20");
    const statusMap = {
      Pending: "pending",
      Approved: "approved",
      Rejected: "rejected",
      Completed: "approved",
    };
    const status = statusMap[filter];
    if (status) p.set("status", status);
    p.set("sort", "-createdAt");
    return p.toString();
  }, [page, filter]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/requests/my?${query}`);
        if (!active) return;
        setRequests(Array.isArray(res.data?.requests) ? res.data.requests : []);
      } catch (e) {
        if (!active) return;
        console.error(e);
        setRequests([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [query]);

  const now = Date.now();
  const computed = useMemo(() => {
    // Normalize items for UI
    return requests.map((r) => {
      const startISO = r.startTime ? new Date(r.startTime).toISOString() : "";
      const endISO = r.endTime ? new Date(r.endTime).toISOString() : "";
      const duration =
        typeof r.durationHours === "number"
          ? `${r.durationHours}h`
          : r.startTime && r.endTime
          ? `${Math.max(
              0,
              Math.round((new Date(r.endTime) - new Date(r.startTime)) / 36e5)
            )}h`
          : "—";
      const uiStatus =
        r.status === "approved" &&
        r.endTime &&
        new Date(r.endTime).getTime() < now
          ? "completed"
          : r.status;
      return {
        id: r._id,
        uiStatus,
        resource: r.resource?.name || "Resource",
        category: r.resource?.type || "",
        requestDate: r.createdAt
          ? new Date(r.createdAt).toISOString().slice(0, 10)
          : "—",
        duration,
        startTime: startISO || "—",
        endTime: endISO || "—",
        purpose: r.purpose || "",
        adminComment: r.remarks || "",
        updatedAt: r.updatedAt,
      };
    });
  }, [requests, now]);

  const filteredRequests = useMemo(() => {
    if (filter === "All") return computed;
    if (filter === "Completed")
      return computed.filter((r) => r.uiStatus === "completed");
    return computed.filter(
      (r) => r.uiStatus?.toLowerCase() === filter.toLowerCase()
    );
  }, [computed, filter]);

  const countFor = (tab) => {
    if (tab === "All") return computed.length;
    if (tab === "Completed")
      return computed.filter((r) => r.uiStatus === "completed").length;
    return computed.filter(
      (r) => r.uiStatus?.toLowerCase() === tab.toLowerCase()
    ).length;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-500 mt-1">
            Track and manage your resource requests
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant="ghost"
            className={`rounded-none border-b-2 ${
              filter === tab
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => {
              setPage(1);
              setFilter(tab);
            }}
          >
            {tab} ({countFor(tab)})
          </Button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}

      {!loading && filteredRequests.length === 0 && (
        <div className="text-sm text-gray-500">No requests found.</div>
      )}

      <div className="space-y-4">
        {filteredRequests.map((req) => (
          <Card
            key={req.id}
            className="border border-gray-200 shadow-sm rounded-lg"
          >
            <CardHeader className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {req.resource}{" "}
                  {req.category && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs font-medium"
                    >
                      {req.category}
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <Badge
                className={`${
                  req.uiStatus === "approved"
                    ? "bg-green-100 text-green-700"
                    : req.uiStatus === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : req.uiStatus === "completed"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {req.uiStatus}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                  <span>
                    <span className="font-medium">Request Date:</span>{" "}
                    {req.requestDate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    <span className="font-medium">Duration:</span>{" "}
                    {req.duration}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <p>
                  <span className="font-medium">Start Time:</span>{" "}
                  {req.startTime}
                </p>
                <p>
                  <span className="font-medium">End Time:</span> {req.endTime}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Purpose</span>
                </div>
                <div className="bg-gray-100 text-gray-800 p-2 mt-1 rounded-md">
                  {req.purpose || "—"}
                </div>
              </div>

              {req.adminComment && (
                <div className="bg-orange-100 text-gray-800 p-2 rounded-md border-l-4 border-orange-400">
                  <span className="font-medium">Admin Comment: </span>
                  {req.adminComment}
                </div>
              )}

              {req.uiStatus === "pending" && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 flex items-center gap-1"
                    onClick={async () => {
                      try {
                        await api.post(`/requests/${req.id}/cancel`, {
                          remarks: "Cancelled by user",
                        });
                        // refetch after cancel
                        const res = await api.get(`/requests/my?${query}`);
                        setRequests(
                          Array.isArray(res.data?.requests)
                            ? res.data.requests
                            : []
                        );
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    <X className="w-4 h-4" /> Cancel Request
                  </Button>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Updated {req.updatedAt ? timeAgo(req.updatedAt) : "—"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
