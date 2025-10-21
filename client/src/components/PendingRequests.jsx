"use client";
import { Layout } from "./layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User } from "lucide-react";

export default function PendingRequests() {
  const stats = {
    pending: 2,
    approved: 5,
    rejected: 1,
  };

  const requests = [
    {
      id: "REQ001",
      resourceName: "GPU Server A1",
      resourceType: "GPU Server",
      requester: "Mihir Patel",
      email: "mihir@nitc.ac.in",
      role: "Student",
      purpose: "Deep Learning Model Training for Research Project on Computer Vision",
      duration: "2025-10-01 to 2025-10-05",
      time: "09:00 - 17:00",
      status: "Pending",
    },
    {
      id: "REQ002",
      resourceName: "High-Performance Server",
      resourceType: "Server",
      requester: "Saurabh Tripathi",
      email: "saurabh@nitc.ac.in",
      role: "Faculty",
      purpose: "Data Analysis for AI Research",
      duration: "2025-10-10 to 2025-10-15",
      time: "10:00 - 18:00",
      status: "Pending",
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen p-8 bg-white">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pending Requests</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and manage resource allocation requests
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 shadow-sm border border-gray-200">
            <div className="text-gray-500 text-sm mb-1">Pending Requests</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.pending}
            </div>
          </Card>
          <Card className="p-4 shadow-sm border border-gray-200">
            <div className="text-gray-500 text-sm mb-1">Approved Today</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.approved}
            </div>
          </Card>
          <Card className="p-4 shadow-sm border border-gray-200">
            <div className="text-gray-500 text-sm mb-1">Rejected Today</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.rejected}
            </div>
          </Card>
        </div>

        {/* Request Cards */}
        <div className="flex flex-col gap-6">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function RequestCard({ request }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {request.resourceName}
            </h2>
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
              {request.resourceType}
            </Badge>
          </div>
          <Badge className="bg-yellow-100 text-yellow-700">
            {request.status}
          </Badge>
        </div>

        {/* Request Info */}
        <p className="text-sm text-gray-600 mb-3">
          <span className="font-medium">Request ID:</span> {request.id}
        </p>

        {/* Requested By */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 mb-4">
          <div className="flex items-start gap-2">
            <User className="w-5 h-5 text-gray-500 mt-1" />
            <div>
              <p className="font-medium text-gray-900">{request.requester}</p>
              <p className="text-sm text-gray-500">{request.email}</p>
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-700 text-xs mt-1"
              >
                {request.role}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-3 sm:mt-0">
            <div className="flex items-center gap-2 text-gray-700">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Duration:{" "}
                <span className="font-medium">{request.duration}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Time: <span className="font-medium">{request.time}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className="mb-5">
          <p className="text-sm text-gray-500 font-medium mb-1">Purpose</p>
          <div className="bg-gray-50 text-gray-800 p-3 rounded-md text-sm">
            {request.purpose}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-blue-700 hover:bg-blue-800 flex-1">
            ✓ Approve
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 flex-1">
            ✗ Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
