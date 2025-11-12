import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      console.error(error);
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
      <Card className="p-6 border border-border shadow-sm bg-card text-card-foreground">
        <div className="text-sm text-muted-foreground">Loading resource...</div>
      </Card>
    );
  }

  if (error || !resource) {
    return (
      <Card className="p-6 border border-border shadow-sm bg-card text-card-foreground">
        <div className="text-sm text-destructive">
          {error || "Resource not found."}
        </div>
      </Card>
    );
  }

  // Adaptive status colors
  const statusColor =
    resource.status === "available"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
      : resource.status === "in_use"
      ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
      : "bg-muted text-muted-foreground border-border";

  return (
    <Card className="border border-border shadow-md overflow-hidden bg-card text-card-foreground">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-0">
        <div>
          <CardTitle className="text-2xl font-bold mb-1 text-foreground">
            {resource.name}
          </CardTitle>

          {resource.description && (
            <CardDescription className="text-muted-foreground text-sm max-w-2xl">
              {resource.description}
            </CardDescription>
          )}
        </div>

        {resource.status && (
          <Badge className={`border ${statusColor} text-sm px-3 py-1`}>
            {resource.status === "available" ? (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            ) : resource.status === "in_use" ? (
              <AlertCircle className="h-4 w-4 mr-1" />
            ) : null}
            {resource.status.replace("_", " ")}
          </Badge>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="p-5 flex flex-col sm:flex-row gap-5">
        {/* Left: Image */}
        <div className="w-full sm:w-52 h-52 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border">
          {resource.images?.length ? (
            <img
              src={resource.images[0]}
              alt={`${resource.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        {/* Right: Details */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {resource.type && (
              <Badge
                variant="outline"
                className="capitalize border-border bg-background text-foreground dark:bg-muted"
              >
                {resource.type}
              </Badge>
            )}
            {resource.department && (
              <Badge className="bg-secondary text-secondary-foreground">
                {resource.department}
              </Badge>
            )}
            {resource.capacity != null && (
              <Badge className="bg-secondary text-secondary-foreground">
                Capacity {resource.capacity}
              </Badge>
            )}
            {resource.isActive ? (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800">
                Inactive
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {resource.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {resource.location}
              </span>
            )}
            <Separator orientation="vertical" className="h-4" />
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              {resource.requiresApproval
                ? "Requires Approval"
                : "Instant Booking"}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="inline-flex items-center gap-1">
              <Timer className="h-4 w-4" />
              Max {resource.maxBookingDuration}h / session
            </span>
          </div>

          {/* Availability */}
          <AvailabilityDisplay availability={resource.availability} />
        </div>
      </CardContent>

      <div className="bg-muted/40 border-t border-border text-sm p-5 text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Usage Rules:</p>
        {resource.usageRules?.length > 0 &&
        resource.usageRules.some((r) => r.trim()) ? (
          <ul className="list-disc pl-5 space-y-1">
            {resource.usageRules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        ) : (
          <p>No specific usage rules defined.</p>
        )}
      </div>
    </Card>
  );
};

export default ResourceHeader;
