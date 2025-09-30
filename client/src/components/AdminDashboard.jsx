// AdminDashboard.jsx
"use client";
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
import { Layout } from "./layout/Layout";

export default function AdminDashboard() {
  return (
    <Layout>
      <div className="min-h-screen flex">
        {/* Main Content */}
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

          {/* Top cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <DashboardCard
              title="Total Resources"
              value="25"
              subtitle="Across all departments"
              icon={<Server className="w-5 h-5 text-gray-500" />}
            />
            <DashboardCard
              title="Available"
              value="18"
              subtitle="Ready for booking"
              icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            />
            <DashboardCard
              title="Pending Requests"
              value="8"
              subtitle="Need review"
              icon={<AlertCircle className="w-5 h-5 text-yellow-500" />}
            />
            <DashboardCard
              title="Total Users"
              value="156"
              subtitle="Active accounts"
              icon={<Users className="w-5 h-5 text-gray-500" />}
            />
            <Card className="">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Utilization
                </CardTitle>
                <TrendingUp className="h-4 w-4  text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="font-semibold text-orange-500 text-2xl mb-2">
                  72%
                </div>
                <Progress value={72} className="h-2 bg-gray-200" />
              </CardContent>
            </Card>
          </div>

          {/* Main Cards: Pending & Activity */}
          <div className="grid grid-cols-2 gap-6">
            {/* Pending Requests */}
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
                <PendingRequest
                  name="John Doe"
                  resource="GPU Server 02"
                  date="2025-09-30"
                  duration="4h"
                />
                <PendingRequest
                  name="Jane Smith"
                  resource="3D Printer"
                  date="2025-10-01"
                  duration="2h"
                />
                <PendingRequest
                  name="Bob Wilson"
                  resource="Lab Room B"
                  date="2025-10-02"
                  duration="3h"
                />
                <Button variant="link" className="px-0 mt-2 text-blue-600">
                  View All Requests
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-gray-500">Latest system activity</p>
              </CardHeader>
              <CardContent>
                <ActivityItem
                  type="approved"
                  user="Alice Johnson"
                  action="Request approved"
                  detail="GPU Server 01"
                  ago="2 hours ago"
                />
                <ActivityItem
                  type="added"
                  user=""
                  action="New resource added"
                  detail="Projector 05"
                  ago="4 hours ago"
                />
                <ActivityItem
                  type="rejected"
                  user="Mark Brown"
                  action="Request rejected"
                  detail="Lab Room C"
                  ago="6 hours ago"
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  );
}

function SidebarItem({ icon, children, selected }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer font-medium ${
        selected
          ? "bg-[#3b82f6] text-white"
          : "text-gray-700 hover:bg-[#f1f5f9]"
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      {children}
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
      : "text-red-500";
  return (
    <div className="border border-gray-200 rounded-md p-3 mb-3 last:mb-0 flex items-start gap-3 bg-white">
      <span
        className={`w-2 h-2 rounded-full block ${iconColor} mt-[6px] flex-shrink-0`}
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
