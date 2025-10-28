// MyRequests.jsx
"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  Clock,
  FileText,
  X,
} from "lucide-react";

const requestData = [
  {
    id: "REQ001",
    resource: "GPU Server A1",
    category: "GPU Server",
    requestDate: "2025-09-28",
    startTime: "09:00",
    endTime: "17:00",
    duration: "2025-10-01 to 2025-10-05",
    purpose: "Deep Learning Model Training for Research Project",
    status: "Pending",
  },
  {
    id: "REQ002",
    resource: "ML Workstation 1",
    category: "Workstation",
    requestDate: "2025-09-27",
    startTime: "10:00",
    endTime: "16:00",
    duration: "2025-09-29",
    purpose: "Computer Vision Algorithm Testing",
    status: "Approved",
    adminComment: "Approved. Please collect access card from admin office.",
  },
  {
    id: "REQ003",
    resource: "GPU Server A2",
    category: "GPU Server",
    requestDate: "2025-09-25",
    startTime: "11:00",
    endTime: "15:00",
    duration: "2025-09-26",
    purpose: "Model fine-tuning experiments",
    status: "Completed",
  },
];

export default function MyRequests() {
  const [filter, setFilter] = useState("All");

  const filteredRequests = requestData.filter(
    (req) => filter === "All" || req.status === filter
  );

  const tabs = ["All", "Pending", "Approved", "Completed", "Rejected"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-500 mt-1">
            Track and manage your resource requests
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">New Request</Button>
      </div>

      {/* Filter Tabs */}
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
            onClick={() => setFilter(tab)}
          >
            {tab} ({requestData.filter((r) => tab === "All" || r.status === tab).length})
          </Button>
        ))}
      </div>

      {/* Request Cards */}
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
                  <Badge variant="outline" className="ml-2 text-xs font-medium">
                    {req.category}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-500">Request ID: {req.id}</p>
              </div>
              <Badge
                className={`${
                  req.status === "Approved"
                    ? "bg-green-100 text-green-700"
                    : req.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : req.status === "Completed"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {req.status}
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
                  {req.purpose}
                </div>
              </div>

              {req.adminComment && (
                <div className="bg-orange-100 text-gray-800 p-2 rounded-md border-l-4 border-orange-400">
                  <span className="font-medium">Admin Comment: </span>
                  {req.adminComment}
                </div>
              )}

              {req.status === "Pending" && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
