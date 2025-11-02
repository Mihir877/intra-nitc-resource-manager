"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2 } from "lucide-react";
import api from "@/api/axios"; // axios instance for API calls

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    student: 0,
    faculty: 0,
    admin: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------------- Fetch users from backend ---------------- */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users/get-all-users");
        if (res.data.success) {
          const userList = res.data.users;
          setUsers(userList);
          setFilteredUsers(userList);
          calculateStats(userList);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  /* ---------------- Count user roles ---------------- */
  const calculateStats = (userList) => {
    const total = userList.length;
    const student = userList.filter((u) => u.role === "student").length;
    const faculty = userList.filter((u) => u.role === "faculty").length;
    const admin = userList.filter((u) => u.role === "admin").length;
    setStats({ total, student, faculty, admin });
  };

  /* ---------------- Handle search ---------------- */
  const handleSearch = (query) => {
    setSearchQuery(query);
    const lower = query.toLowerCase();

    const filtered = users.filter(
      (u) =>
        u.name?.toLowerCase().includes(lower) ||
        u.username?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower) ||
        u.address?.toLowerCase().includes(lower) ||
        u.role?.toLowerCase().includes(lower) ||
        u.gender?.toLowerCase().includes(lower)
    );

    setFilteredUsers(filtered);
    calculateStats(filtered);
  };

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
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Users" value={stats.total} />
        <StatsCard title="Students" value={stats.student} />
        <StatsCard title="Faculty" value={stats.faculty} />
        <StatsCard title="Admins" value={stats.admin} />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Search users by name, email, address, or role..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-gray-500">No users found.</p>
          ) : (
            filteredUsers.map((user) => (
              <UserItem
                key={user._id}
                initials={getInitials(user.username)}
                name={user.username}
                email={user.email}
                role={user.role}
                address={user.address || ""}
                gender={user.gender || ""}
                registered={formatDateTime(user.createdAt)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDateTime(dateString) {
  if (!dateString) return "—";

  // Ensure we parse it correctly — some APIs send with +00:00 which needs normalization
  const parsed = Date.parse(dateString);
  if (isNaN(parsed)) return "—";

  const date = new Date(parsed);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // convert 0 → 12 for 12 AM

  return `${day}-${month}-${year} ${String(hours).padStart(
    2,
    "0"
  )}:${minutes} ${ampm}`;
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
  address,
  gender,
  registered,
}) {
  const badgeColor =
    role === "student"
      ? "bg-green-100 text-green-700"
      : role === "faculty"
      ? "bg-blue-100 text-blue-700"
      : role === "admin"
      ? "bg-purple-100 text-purple-700"
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
            Registered: {registered}
          </div>
          {/* <div className="text-xs text-gray-500 mt-1">Address: {address}</div> */}
        </div>
      </div>

      {/* Right section - actions */}
      <div className="flex gap-2">
        {/* <Button size="icon" variant="outline" className="h-8 w-8">
          <Edit className="w-4 h-4 text-gray-600" />
        </Button> */}
        <Button size="icon" variant="outline" className="h-8 w-8">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Helper ---------------- */
function getInitials(name = "") {
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
