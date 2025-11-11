import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "../ui/separator";
import PageTitle from "../common/PageTitle";
import DashboardStats from "../common/DashboardStats";
import { Server, Clock, CheckCircle, AlertCircle } from "lucide-react";

const hoverRow =
  "flex items-center justify-between border-b last:border-b-0 py-3 px-2 -mx-2 transition-colors cursor-pointer hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const MAX_ITEMS = 5;

const StudentDashboard = () => {
  const navigate = useNavigate();

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
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard/student");
        if (res.data.success) {
          setStats(res.data.stats);
          setRequests(res.data.recentRequests || []);
          setApprovedRequests(res.data.approvedUpcoming || []);
        }
      } catch (e) {
        console.error("Error loading dashboard:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statusClass = (status) => {
    if (status === "approved")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "pending")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const goToRequest = (req) => {
    if (req?._id) navigate(`/requests/${req._id}`);
    else navigate("/requests");
  };

  const recentLimited = useMemo(() => requests.slice(0, MAX_ITEMS), [requests]);
  const upcomingLimited = useMemo(
    () => approvedRequests.slice(0, MAX_ITEMS),
    [approvedRequests]
  );

  return (
    <div className="min-h-screen flex">
      <main className="flex-1">
        <PageTitle
          title="Dashboard"
          subtitle="Overview of your resource usage and requests"
        />

        <DashboardStats
          stats={[
            {
              label: "Total Requests",
              value: stats.totalRequests,
              subtitle: "All-time requests",
              icon: <Server className="w-5 h-5 text-gray-500" />,
            },
            {
              label: "Approved",
              value: stats.approvedRequests,
              subtitle: `${approvalRate}% approval rate`,
              icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            },
            {
              label: "Pending",
              value: stats.pendingRequests,
              subtitle: "Awaiting review",
              icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
            },
            {
              label: "Hours Used",
              value: `${stats.totalHours}h`,
              subtitle: "This semester",
              icon: <Clock className="w-5 h-5 text-blue-500" />,
            },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Requests */}
          <Card>
            <CardHeader className="border-b p-3 sm:px-6 sm:pt-5">
              <CardTitle className="text-lg font-bold mb-0">
                Recent Requests
              </CardTitle>
              <p className="text-sm text-gray-500">
                Your latest resource requests
              </p>
            </CardHeader>

            <CardContent className="text-sm text-gray-700 px-3 sm:px-6">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  Loading requests...
                </div>
              ) : requests.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  No requests found.
                </div>
              ) : (
                <>
                  {recentLimited.map((req) => (
                    <div
                      key={req._id ?? `${req.resourceId?._id}-${req.startTime}`}
                      onClick={() => goToRequest(req)}
                      className={hoverRow}
                    >
                      <div>
                        <span className="font-medium text-gray-800">
                          {req.resourceId?.name || "Unknown Resource"}
                        </span>
                        <div className="text-xs text-gray-500">
                          {new Date(req.startTime).toLocaleDateString()} •{" "}
                          {req.duration
                            ? req.duration
                            : `${new Date(req.startTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )} - ${new Date(req.endTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}`}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusClass(req.status)}
                      >
                        {req.status}
                      </Badge>
                    </div>
                  ))}

                  {stats.totalRequests > 5 && (
                    <Button
                      variant="outline"
                      className="mt-3 w-full text-blue-600 hover:text-blue-700"
                      onClick={() => navigate("/requests")}
                    >
                      View more
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader className="border-b p-3 sm:px-6 sm:pt-5">
              <CardTitle className="text-lg font-bold mb-0">
                Upcoming Bookings
              </CardTitle>
              <p className="text-sm text-gray-500">
                Your upcoming resource bookings
              </p>
            </CardHeader>

            <CardContent className="text-sm text-gray-700 px-3 sm:px-6">
              {loading ? (
                <div className="text-gray-500 flex items-center justify-center h-40">
                  Loading bookings...
                </div>
              ) : approvedRequests.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  No approved bookings found.
                </div>
              ) : (
                <>
                  {upcomingLimited.map((req) => (
                    <div
                      key={req._id ?? `${req.resourceId?._id}-${req.startTime}`}
                      onClick={() => goToRequest(req)}
                      className={hoverRow}
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
                  ))}

                  <Button
                    variant="outline"
                    className="mt-4 w-full text-blue-600 hover:text-blue-700"
                    onClick={() => navigate("/schedule")}
                  >
                    View Schedule
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
