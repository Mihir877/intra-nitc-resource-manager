// StudentDashboard.jsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { dummyResources, dummyUsageHistory } from "@/data/dummyData";

const StudentDashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
      <div className="grid grid-cols-2 gap-8">
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-2">Available Resources</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Resource ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Availability</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {dummyResources.map((res, i) => (
                <TableRow key={i}>
                  <TableCell>{res.resourceId}</TableCell>
                  <TableCell>{res.name}</TableCell>
                  <TableCell>{res.type}</TableCell>
                  <TableCell>{res.description}</TableCell>
                  <TableCell>{res.location}</TableCell>
                  <TableCell>{res.availability}</TableCell>
                  <TableCell>
                    {res.status === "Available" ? (
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
          <h2 className="font-semibold text-lg mb-3">Request Resource</h2>
          <form className="space-y-4">
            <label htmlFor="resource-select" className="font-medium block mb-1">
              Select Resource
            </label>
            <Select id="resource-select">
              <SelectTrigger>
                <SelectValue placeholder="Choose a resource" />
              </SelectTrigger>
              <SelectContent>
                {dummyResources.map((res) => (
                  <SelectItem key={res.resourceId} value={res.name}>
                    {res.name} ({res.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <label htmlFor="datetime" className="font-medium block mb-1">
                Date &amp; Time
              </label>
              <Input id="datetime" type="datetime-local" />
            </div>
            <div>
              <label htmlFor="duration" className="font-medium block mb-1">
                Duration (hours)
              </label>
              <Input id="duration" type="number" min="1" />
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
};

export default StudentDashboard;
