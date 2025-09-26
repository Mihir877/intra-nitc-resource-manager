// src/App.jsx
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// ==================== Dummy Data ====================
const dummyResources = [
  { id: 1, name: "Projector", description: "Full HD", available: true },
  { id: 2, name: "Lab Room", description: "Computer Lab", available: true },
  { id: 3, name: "Conference Room", description: "Seats 20", available: false },
];

const dummyRequests = [
  {
    id: 1,
    resource: "Projector",
    user: "Alice",
    date: "2025-10-05",
    duration: 2,
    status: "Pending",
  },
  {
    id: 2,
    resource: "Lab Room",
    user: "Bob",
    date: "2025-10-06",
    duration: 3,
    status: "Approved",
  },
  {
    id: 3,
    resource: "3D Printer",
    user: "Charlie",
    date: "2025-10-07",
    duration: 1,
    status: "Pending",
  },
];

const dummyUsageHistory = [
  {
    id: 1,
    resource: "Projector",
    user: "Alice",
    date: "2025-09-10",
    duration: 2,
  },
  { id: 2, resource: "Lab Room", user: "Bob", date: "2025-09-12", duration: 3 },
  {
    id: 3,
    resource: "3D Printer",
    user: "Charlie",
    date: "2025-09-13",
    duration: 1,
  },
];

// ========================= STUDENT DASHBOARD =========================
function StudentDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
      <div className="grid grid-cols-2 gap-8">
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-2">Available Resources</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Availability</TableCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {dummyResources.map((res) => (
                <TableRow key={res.id}>
                  <TableCell>{res.name}</TableCell>
                  <TableCell>{res.description}</TableCell>
                  <TableCell>
                    {res.available ? (
                      <Badge variant="outline">Available</Badge>
                    ) : (
                      <Badge
                        className="bg-red-200 text-red-700"
                        variant="destructive"
                      >
                        Booked
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-2">Request Resource</h2>
          <form className="space-y-2">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Resource" />
              </SelectTrigger>
              <SelectContent>
                {dummyResources.map((res) => (
                  <SelectItem key={res.id} value={res.name}>
                    {res.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <label className="block mb-1">Date & Time</label>
              <Input type="datetime-local" />
            </div>
            <div>
              <label className="block mb-1">Duration (hours)</label>
              <Input type="number" />
            </div>
            <Button className="w-full">Submit Request</Button>
          </form>
        </Card>
      </div>

      <Card className="mt-8 p-4">
        <h2 className="font-semibold text-lg mb-2">
          My Resource Usage History
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Resource</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {dummyUsageHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.resource}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.duration} hr(s)</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

// ========================= ADMIN DASHBOARD =========================
function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <Card className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-lg">Manage Resources</h2>
          <Button>Add Resource</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {dummyResources.map((res) => (
              <TableRow key={res.id}>
                <TableCell>{res.name}</TableCell>
                <TableCell>{res.description}</TableCell>
                <TableCell>
                  {res.available ? (
                    <Badge variant="outline">Available</Badge>
                  ) : (
                    <Badge
                      className="bg-red-200 text-red-700"
                      variant="destructive"
                    >
                      Booked
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm">Edit</Button>
                  <Button size="sm" className="bg-red-600 text-white">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold text-lg mb-2">Pending Requests</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {dummyRequests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.user}</TableCell>
                <TableCell>{req.resource}</TableCell>
                <TableCell>{req.date}</TableCell>
                <TableCell>{req.duration} hr(s)</TableCell>
                <TableCell>
                  {req.status === "Approved" ? (
                    <Badge variant="outline">Approved</Badge>
                  ) : req.status === "Pending" ? (
                    <Badge variant="secondary">Pending</Badge>
                  ) : (
                    <Badge
                      className="bg-red-200 text-red-700"
                      variant="destructive"
                    >
                      Rejected
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm">Approve</Button>
                  <Button size="sm" className="bg-red-600 text-white">
                    Reject
                  </Button>
                  <Button size="sm" variant="secondary">
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

// ========================= SCHEDULE PAGE =========================
function SchedulePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Resource Schedule</h1>
      <Card className="p-8 text-center text-gray-500">
        Calendar / grid view of resources with color-coded availability goes
        here
      </Card>
    </div>
  );
}

// ========================= APP =========================
export default function App() {
  const [userRole, setUserRole] = useState("student"); // default: student

  return (
    <Router>
      <nav className="p-4 bg-white border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="font-bold">IRM System</span>
          <Select value={userRole} onValueChange={setUserRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Dashboard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student Dashboard</SelectItem>
              <SelectItem value="admin">Admin Dashboard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUserRole("student")}
          >
            Logout
          </Button>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            userRole === "admin" ? <AdminDashboard /> : <StudentDashboard />
          }
        />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="*" element={<div className="p-8">Page Not Found</div>} />
      </Routes>
    </Router>
  );
}
