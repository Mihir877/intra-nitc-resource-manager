// SchedulePage.jsx
import React from "react";
import { Card } from "@/components/ui/card";

const SchedulePage = () => {
  return (
    <div className="">
      <h1 className="text-3xl font-bold text-gray-900 pb-4">Resource Schedule</h1>
      <Card className="p-8 text-center text-gray-500">
        Calendar/grid view of resources with color-coded availability will be
        implemented here.
      </Card>
    </div>
  );
};

export default SchedulePage;
