import React from "react";
import { useParams } from "react-router-dom";
import ResourceHeader from "./ResourceHeader";
import ResourceSchedule from "./ResourceSchedule";

export default function ResourceDetailPage() {
  const { id: resourceId } = useParams();

  return (
    <div className="max-w-5xl mx-auto ">
      <ResourceHeader resourceId={resourceId} />
      <div className="mt-6">
        <ResourceSchedule resourceId={resourceId} />
      </div>
    </div>
  );
}
