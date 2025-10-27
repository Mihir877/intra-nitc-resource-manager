"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Edit, Trash2 } from "lucide-react";

export default function UserManagement() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all system users and their access
          </p>
        </div>
        <Button className="flex gap-2 items-center bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Users" value="4" />
        <StatsCard title="Students" value="2" />
        <StatsCard title="Faculty" value="1" />
        <StatsCard title="Admins" value="1" />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Search users by name, email, or department..."
          className="w-full"
        />
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Users (4)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserItem
            initials="MP"
            name="Mihir Patel"
            email="mihir@nitc.ac.in"
            role="student"
            dept="Computer Science"
            registered="2025-01-15"
            activeRequests={1}
            totalUsage="42h"
          />
          <UserItem
            initials="ST"
            name="Saurabh Tripathi"
            email="saurabh@nitc.ac.in"
            role="faculty"
            dept="Computer Science"
            registered="2024-08-20"
            activeRequests={2}
            totalUsage="128h"
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Components ---------------- */

function StatsCard({ title, value }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-semibold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600 mt-1">{title}</div>
      </CardContent>
    </Card>
  );
}

function UserItem({
  initials,
  name,
  email,
  role,
  dept,
  registered,
  activeRequests,
  totalUsage,
}) {
  const badgeColor =
    role === "student"
      ? "bg-green-100 text-green-700"
      : role === "faculty"
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-700";

  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
      {/* Left section - user info */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{name}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${badgeColor}`}
            >
              {role}
            </span>
          </div>
          <div className="text-sm text-gray-500">{email}</div>
          <div className="text-xs text-gray-500 mt-1">
            {dept} • Registered: {registered} • Active Requests:{" "}
            {activeRequests} • Total Usage: {totalUsage}
          </div>
        </div>
      </div>

      {/* Right section - actions */}
      <div className="flex gap-2">
        <Button size="icon" variant="outline" className="h-8 w-8">
          <Edit className="w-4 h-4 text-gray-600" />
        </Button>
        <Button size="icon" variant="outline" className="h-8 w-8">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
