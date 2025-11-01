import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Timer,
  ShieldCheck,
  ImageIcon,
} from "lucide-react";
import AvailabilityDisplay from "./AvailabilityDisplay";
import api from "@/api/axios";

const ResourceHeader = ({ resourceId }) => {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!resourceId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/resources/${resourceId}`);
      setResource(res.data?.resource);
    } catch (error) {
      console.error("error: ", error);
      setError("Failed to load resource details");
    } finally {
      setLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className="p-6 border border-muted shadow-sm">
        <div className="text-sm text-muted-foreground">Loading resource...</div>
      </Card>
    );
  }

  if (error || !resource) {
    return (
      <Card className="p-6 border border-muted shadow-sm">
        <div className="text-sm text-red-600">
          {error || "Resource not found."}
        </div>
      </Card>
    );
  }

  const statusColor =
    resource.status === "available"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : resource.status === "in_use"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-muted text-muted-foreground border-muted";

  return (
    <Card className="mb-3 border border-muted shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-2xl mb-4 ml-1">
            {resource.name || "Resource"}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 mt-1 -ml-1">
            {resource.type ? (
              <Badge variant="outline" className="capitalize">
                {resource.type}
              </Badge>
            ) : null}
            {resource.category ? (
              <Badge variant="outline">{resource.category}</Badge>
            ) : null}
            {resource.capacity != null ? (
              <Badge variant="secondary">Capacity {resource.capacity}</Badge>
            ) : null}
          </CardDescription>
        </div>

        {resource.status && (
          <Badge className={`border ${statusColor}`}>
            {resource.status === "available" ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : resource.status === "in_use" ? (
              <AlertCircle className="h-3 w-3 mr-1" />
            ) : null}
            {resource.status.replace("_", " ")}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex gap-4">
        <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
          {resource.images?.length ? (
            <img
              src={resource.images[0]}
              alt={`${resource.name} photo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {resource.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {resource.location}
              </span>
            ) : null}
            <Separator orientation="vertical" className="h-4" />
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {resource.requiresApproval
                ? "Requires Approval"
                : "Instant Booking"}
            </span>
            <Separator orientation="vertical" className="h-4" />
            {resource.maxBookingDuration != null ? (
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3 w-3" /> Up to{" "}
                {resource.maxBookingDuration}h
              </span>
            ) : null}
          </div>

          <AvailabilityDisplay availability={resource.availability} />
        </div>
      </CardContent>

      {/* <CardFooter className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            View policy
          </Button>
        </div>
      </CardFooter> */}
    </Card>
  );
};

export default ResourceHeader;
