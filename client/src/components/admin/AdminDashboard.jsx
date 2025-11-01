"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Server,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react";
import api from "@/api/axios"; // your axios instance
import { timeAgo } from "@/utils/dateUtils";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!stats || !stats.success)
    return <div className="p-8">Failed to load dashboard</div>;
  const d = stats.stats;
  const pendingList = stats.pendingRequests ?? [];
  const activityList = stats.recentActivity ?? [];

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Resource management and system overview
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button className="flex gap-2 items-center bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4" /> Add Resource
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard
            title="Total Resources"
            value={d.totalResources}
            subtitle="Across all departments"
            icon={<Server className="w-5 h-5 text-gray-500" />}
          />
          <DashboardCard
            title="Available"
            value={d.availableResources}
            subtitle="Ready for booking"
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          />
          <DashboardCard
            title="Pending Requests"
            value={d.pendingRequests}
            subtitle="Need review"
            icon={<AlertCircle className="w-5 h-5 text-yellow-500" />}
          />
          <DashboardCard
            title="Total Users"
            value={d.totalUsers}
            subtitle="Active accounts"
            icon={<Users className="w-5 h-5 text-gray-500" />}
          />
          {/*
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-orange-500 text-2xl mb-2">
                {d.utilization}%
              </div>
              <Progress value={d.utilization} className="h-2 bg-gray-200" />
            </CardContent>
          </Card>
           */}
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Pending Requests
              </CardTitle>
              <p className="text-sm text-gray-500">
                Requests awaiting your approval
              </p>
            </CardHeader>
            <CardContent>
              {pendingList.length === 0 && (
                <div className="text-gray-500 py-2">No pending requests.</div>
              )}
              {pendingList.map((req, i) => (
                <PendingRequest
                  key={req._id || i}
                  name={req.userId?.username || "Unknown"}
                  resource={req.resourceId?.name || ""}
                  date={req.startTime?.slice(0, 10)}
                  duration={req.duration ? `${req.duration}h` : ""}
                />
              ))}
              <Button variant="link" className="px-0 mt-2 text-blue-600">
                View All Requests
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">
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
    </div>
  );
}

function DashboardCard({ title, value, subtitle, icon }) {
  return (
    <Card className="">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <span className="w-4 h-4 flex items-center justify-center text-gray-500">
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function PendingRequest({ name, resource, date, duration }) {
  return (
    <div className="flex items-center justify-between border-b last:border-b-0 py-3">
      <div>
        <span className="font-medium text-gray-800">{name}</span>
        <div className="text-xs text-gray-500">
          {resource} • {date} • {duration}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="icon" className="h-7 w-7" variant="outline">
          <CheckCircle className="text-green-500 w-5 h-5" />
        </Button>
        <Button size="icon" className="h-7 w-7" variant="outline">
          <XCircle className="text-red-500 w-5 h-5" />
        </Button>
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
