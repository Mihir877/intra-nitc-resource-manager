import React from "react";
import { useParams } from "react-router-dom";
import ResourceHeader from "./ResourceHeader";
import ResourceSchedule from "./ResourceSchedule";

export default function ResourceDetailPage() {
  const { id: resourceId } = useParams();

  // Booking slot handler
  const handleSelectSlot = (start, end, resourceId) => {
    // Implement booking logic or modal here
    alert(
      `Requesting booking for resource ${resourceId} from ${start.toLocaleString()} to ${end.toLocaleString()}`
    );
    // You can call your API here with accessToken and slot details
  };

  return (
    <div className="max-w-5xl mx-auto ">
      <ResourceHeader resourceId={resourceId} />
      <div className="mt-6">
        <ResourceSchedule
          resourceId={resourceId}
          onSelectSlot={handleSelectSlot}
        />
      </div>
    </div>
  );
}
