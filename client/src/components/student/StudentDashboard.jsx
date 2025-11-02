import React from "react";
("use client");
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import api from "@/api/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dummyRecentRequests, dummyUpcomingBookings } from "@/data/dummyData";

const StudentDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    totalHours: 0,
  });
  const approvalRate =
    stats.totalRequests > 0
      ? ((stats.approvedRequests / stats.totalRequests) * 100).toFixed(1)
      : 0;
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/requests"); // your backend route
        if (res.data.success) {
          setRequests(res.data.requests);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/requests/count"); // <-- your backend route
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching request stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchApprovedRequests = async () => {
      try {
        const res = await api.get("/requests");
        if (res.data.success) {
          // Filter only approved requests
          const approved = res.data.requests.filter(
            (r) => r.status === "Approved"
          );
          setApprovedRequests(approved);
        }
      } catch (error) {
        console.error("Error fetching approved requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedRequests();
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Main content */}
      <main className="flex-1">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Overview of your resource usage and requests
            </p>
          </div>
          {/* <Button className="bg-orange-500 hover:bg-orange-600">
            + Request Resource
          </Button> */}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
          {/* Total Requests */}
          <Card className="p-5">
            <h3 className="text-gray-600 font-semibold">Total Requests</h3>
            <p className="text-2xl font-bold">{stats.totalRequests}</p>
          </Card>

          {/* Approved */}
          <Card className="p-5">
            <h3 className="text-gray-600 font-semibold">Approved</h3>
            <p className="text-2xl font-bold">{stats.approvedRequests}</p>
            <p className="text-green-500 text-sm">
              {approvalRate}% approval rate
            </p>
          </Card>

          {/* Pending */}
          <Card className="p-5">
            <h3 className="text-gray-600 font-semibold">Pending</h3>
            <p className="text-2xl font-bold">{stats.pendingRequests}</p>
            <p className="text-yellow-500 text-sm">Awaiting approval</p>
          </Card>

          {/* Hours Used */}
          <Card className="p-5">
            <h3 className="text-gray-600 font-semibold">Hours Used</h3>
            <p className="text-2xl font-bold">{stats.totalHours}h</p>
            <p className="text-gray-400 text-sm">This semester</p>
          </Card>
        </div>

        {/* Recent Requests and Upcoming Bookings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Requests */}
          <Card className="p-5">
            <div className="text-sm text-gray-700">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  Loading requests...
                </div>
              ) : requests.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  No requests found.
                </div>
              ) : (
                requests.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b last:border-b-0 py-3"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {req.resourceId?.name || "Unknown Resource"}
                      </span>
                      <div className="text-xs text-gray-500">
                        {req.userId?.username || "Unknown User"} •{" "}
                        {new Date(req.startTime).toLocaleDateString()} •{" "}
                        {req.duration
                          ? req.duration
                          : `${new Date(req.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} - ${new Date(req.endTime).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}`}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        req.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : req.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
          {/* Upcoming Bookings */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-2">Upcoming Bookings</h3>
            <p className="text-gray-400 text-sm mb-4">
              Your approved resource bookings
            </p>

            <div>
              {loading ? (
                <div className="text-gray-500 flex items-center justify-center h-40">
                  Loading bookings...
                </div>
              ) : approvedRequests.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  No approved bookings found.
                </div>
              ) : (
                approvedRequests.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b last:border-b-0 py-3"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {req.resourceId?.name || "Unknown Resource"}
                      </span>
                      <div className="text-xs text-gray-500">
                        Resource •{" "}
                        {new Date(req.startTime).toLocaleDateString()} •{" "}
                        <span className="font-semibold text-gray-900">
                          {new Date(req.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(req.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button variant="outline" className="mt-4 w-full">
              View Schedule
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
