// AdminDashboard.jsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dummyResources, dummyRequests } from "@/data/dummyData";

const AdminDashboard=()=>{
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
              <TableCell>Resource ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
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
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      Pending
                    </Badge>
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

export default AdminDashboard;
