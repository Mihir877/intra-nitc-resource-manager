import React from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "./layout/Layout";
import { dummyRecentRequests, dummyUpcomingBookings } from "@/data/dummyData";


// const statusColors = {
//   Approved: "green",
//   Pending: "yellow",
//   Rejected: "red",
// };

const StudentDashboard = () => {
  return (
    <Layout>
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
            <Button className="bg-orange-500 hover:bg-orange-600">
              + Request Resource
            </Button>
          </header>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
            <Card className="p-5">
              <h3 className="text-gray-600 font-semibold">Total Requests</h3>
              <p className="text-2xl font-bold">12</p>
              <p className="text-gray-400 text-sm">+2 from last month</p>
            </Card>
            <Card className="p-5">
              <h3 className="text-gray-600 font-semibold">Approved</h3>
              <p className="text-2xl font-bold">8</p>
              <p className="text-green-500 text-sm">67% approval rate</p>
            </Card>
            <Card className="p-5">
              <h3 className="text-gray-600 font-semibold">Pending</h3>
              <p className="text-2xl font-bold">2</p>
              <p className="text-yellow-500 text-sm">Awaiting approval</p>
            </Card>
            <Card className="p-5">
              <h3 className="text-gray-600 font-semibold">Hours Used</h3>
              <p className="text-2xl font-bold">45.5h</p>
              <p className="text-gray-400 text-sm">This semester</p>
            </Card>
          </div>

          {/* Recent Requests and Upcoming Bookings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Requests */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-2">Recent Requests</h3>
              <p className="text-gray-400 text-sm mb-4">
                Your latest resource requests
              </p>
              <div>
                {dummyRecentRequests.map(
                  ({ name, date, duration, status }, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b last:border-b-0 py-3"
                    >
                      <div>
                        <span className="font-medium text-gray-800">
                          {name}
                        </span>
                        <div className="text-xs text-gray-500">
                          Resource • {date} • {duration}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${
                          status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status}
                      </Badge>
                    </div>
                  )
                )}
              </div>
              <Button variant="outline" className="mt-4 w-full">
                View All Requests
              </Button>
            </Card>

            {/* Upcoming Bookings */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-2">Upcoming Bookings</h3>
              <p className="text-gray-400 text-sm mb-4">
                Your approved resource bookings
              </p>
              <div>
                {dummyUpcomingBookings.map(({ name, date, time }, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b last:border-b-0 py-3"
                  >
                    <div>
                      <span className="font-medium text-gray-800">{name}</span>
                      <div className="text-xs text-gray-500">
                        Resource • {date} •{" "}
                        <span className="font-semibold text-gray-900">
                          {time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full">
                View Schedule
              </Button>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
