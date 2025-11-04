import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Cpu,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import api from "@/api/axios";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const uiStatus = (backendStatus) => {
  const s = String(backendStatus || "").toLowerCase();
  if (s === "available")
    return {
      label: "Available",
      color: "bg-green-100 text-green-700",
      pill: "bg-green-50 text-green-700",
      isAvailable: true,
    };
  if (s === "in-use" || s === "booked" || s === "unavailable")
    return {
      label: "In-Use",
      color: "bg-gray-100 text-gray-600",
      pill: "bg-gray-50 text-gray-600",
      isAvailable: false,
    };
  return {
    label: "Unknown",
    color: "bg-gray-100 text-gray-600",
    pill: "bg-gray-50 text-gray-600",
    isAvailable: false,
  };
};

const toUICard = (r) => {
  const s = uiStatus(r.status);
  const specsParts = [];
  if (r.category) specsParts.push(`Category: ${r.category}`);
  if (r.department) specsParts.push(`Dept: ${r.department}`);
  if (r.maxBookingDuration != null)
    specsParts.push(`Max ${r.maxBookingDuration}h`);
  if (r.requiresApproval === true) specsParts.push("Requires approval");
  const specs = specsParts.join(" • ");

  const availabilityStr = Array.isArray(r.availability)
    ? r.availability
        .map((a) => `${a.day} ${a.startTime}-${a.endTime}`)
        .join(", ")
    : "";

  return {
    id: r._id,
    name: r.name || "Untitled Resource",
    type: r.type || "Resource",
    specs,
    location: r.location || "",
    statusLabel: s.label,
    statusColor: s.color,
    ctaPill: s.pill,
    isAvailable: s.isAvailable,
    availabilityStr,
    description: r.description || "",
    raw: r,
  };
};

export default function BrowseResources() {
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErr(null);
    api
      .get("/resources/")
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res?.data?.resources)
          ? res.data.resources
          : [];
        setResources(list.map(toUICard));
      })
      .catch((e) => {
        if (!active) return;
        setErr(
          e?.response?.data?.message || e?.message || "Failed to load resources"
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredResources = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return resources.filter((item) => {
      const matchesFilter =
        filter === "All" ||
        item.statusLabel.toLowerCase() === filter.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.specs.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.availabilityStr.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [resources, filter, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Resources</h1>
        <p className="text-gray-500 mt-1">
          Explore available GPU servers, lab equipment, and institutional
          resources
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search resources by name, type, specifications, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => v && setFilter(v)}
          >
            <ToggleGroupItem value="All" aria-label="All">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="Available" aria-label="Available">
              Available
            </ToggleGroupItem>
            <ToggleGroupItem value="In-Use" aria-label="In-Use">
              In-Use
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilter("All");
                    }}
                  >
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear search and filters</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{err}</span>
        </div>
      )}

      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 auto-rows:1fr">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="relative h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <div className="px-6 pb-5 pt-2 mt-auto flex items-center justify-between text-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-28 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredResources.length === 0 && !err && (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-center">
          <p className="text-gray-700 font-medium">No resources found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting filters or search terms
          </p>
        </div>
      )}

      {!loading && filteredResources.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 auto-rows:1fr">
          {filteredResources.map((res) => {
            const to = `/resources/${res.id}`; // use resource id for routing
            return (
              <Link
                key={res.id}
                to={to}
                aria-label={`View resource ${res.name}`}
                className="group block h-full"
              >
                <Card
                  className={[
                    "relative h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm",
                    "transition-all duration-200 ease-out",
                    "hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300",
                    "hover:scale-[1.01] active:scale-[0.995]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "will-change-transform",
                    "flex flex-col",
                  ].join(" ")}
                >
                  <CardHeader className="pb-2 flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {res.name}
                      </CardTitle>
                    </div>
                    <Badge
                      className={["transition-colors", res.statusColor].join(
                        " "
                      )}
                    >
                      {res.statusLabel}
                    </Badge>
                  </CardHeader>

                  <CardContent className="text-sm space-y-3 flex-1">
                    <div>
                      <p className="font-medium text-gray-800">{res.type}</p>
                    </div>

                    {res.specs && (
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Specifications:</span>{" "}
                          {res.specs}
                        </p>
                      </div>
                    )}

                    {res.location && (
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Location:</span>{" "}
                          {res.location}
                        </p>
                      </div>
                    )}

                    {res.availabilityStr && (
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Availability:</span>{" "}
                          {res.availabilityStr}
                        </p>
                      </div>
                    )}
                  </CardContent>

                  <div className="px-6 pb-5 pt-2 mt-auto flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1 text-blue-700">
                      View resource
                      <ChevronRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                    <span
                      className={[
                        "text-xs px-2 py-1 rounded-md",
                        res.ctaPill,
                      ].join(" ")}
                    >
                      {res.isAvailable
                        ? "Open to request"
                        : "Check availability"}
                    </span>
                  </div>

                  <span
                    className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-blue-200/0 group-hover:ring-8 transition-[box-shadow,transform,border-color,ring] duration-200"
                    aria-hidden="true"
                  />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
