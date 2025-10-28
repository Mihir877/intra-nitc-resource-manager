// UsageHistory.jsx
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, FileText, Download } from "lucide-react";

const historyData = [
  {
    id: "HIST001",
    resource: "ML Workstation 1",
    category: "Workstation",
    date: "2025-09-29",
    time: "10:00 – 16:00",
    duration: "6 hours",
    purpose: "Computer Vision Algorithm Testing",
    status: "Completed",
  },
  {
    id: "HIST002",
    resource: "GPU Server A2",
    category: "GPU Server",
    date: "2025-09-28 – 2025-09-30",
    time: "14:00 – 18:00",
    duration: "12 hours",
    purpose: "Neural Network Training",
    status: "Completed",
  },
  {
    id: "HIST003",
    resource: "3D Printer X400",
    category: "Lab Equipment",
    date: "2025-09-20",
    time: "09:00 – 12:00",
    duration: "3 hours",
    purpose: "Prototype fabrication for robotics project",
    status: "Completed",
  },
  {
    id: "HIST004",
    resource: "GPU Server A1",
    category: "GPU Server",
    date: "2025-09-15 – 2025-09-17",
    time: "09:00 – 17:00",
    duration: "16 hours",
    purpose: "Deep learning model training",
    status: "Completed",
  },
  {
    id: "HIST005",
    resource: "Digital Oscilloscope DSO-X",
    category: "Lab Instrument",
    date: "2025-09-10",
    time: "11:00 – 13:00",
    duration: "2 hours",
    purpose: "Signal analysis experiment",
    status: "Completed",
  },
];

export default function UsageHistory() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage History</h1>
          <p className="text-gray-500 mt-1">
            Complete record of your past resource utilization
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 mt-4 md:mt-0"
        >
          <Download className="w-4 h-4" /> Export History
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              Total Resources Used
            </CardTitle>
            <p className="text-2xl font-semibold text-gray-900">
              {historyData.length}
            </p>
          </CardHeader>
        </Card>
        <Card className="text-center border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              Total Usage Time
            </CardTitle>
            <p className="text-2xl font-semibold text-gray-900">82h</p>
          </CardHeader>
        </Card>
        <Card className="text-center border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Most Used</CardTitle>
            <p className="text-2xl font-semibold text-gray-900">GPU Servers</p>
          </CardHeader>
        </Card>
      </div>

      {/* History Cards */}
      <div className="space-y-4">
        {historyData.map((item) => (
          <Card
            key={item.id}
            className="border border-gray-200 shadow-sm rounded-lg"
          >
            <CardHeader className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {item.resource}{" "}
                  <Badge variant="outline" className="ml-2 text-xs font-medium">
                    {item.category}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-500">History ID: {item.id}</p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                {item.status}
              </Badge>
            </CardHeader>

            <CardContent className="text-sm space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                  <span>
                    <span className="font-medium">Date:</span> {item.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    <span className="font-medium">Time:</span> {item.time}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    <span className="font-medium">Duration:</span>{" "}
                    {item.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>
                    <span className="font-medium">Purpose:</span> {item.purpose}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
