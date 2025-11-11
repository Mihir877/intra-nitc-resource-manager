import { useEffect, useMemo, useState } from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useMediaQuery } from "@react-hookz/web";
import { XCircle } from "lucide-react";
import {
  Search,
  Filter,
  Cpu,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
  CalendarClock,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import api from "@/api/axios";
import PageTitle from "../common/PageTitle";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_STYLES = {
  available: "bg-green-50 border-green-200",
  in_use: "bg-orange-50 border-orange-200",
  maintenance: "bg-yellow-50 border-yellow-200",
  disabled: "bg-gray-50 border-gray-200",
};

function useFiltered(resources, { search, type, department }) {
  return useMemo(() => {
    return resources.filter((r) => {
      if (search && !r.name?.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (type && type !== "all" && r.type !== type) return false;
      if (department && department !== "all" && r.department !== department)
        return false;
      return true;
    });
  }, [resources, search, type, department]);
}

export default function BrowseResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    let mounted = true;
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await api.get("/resources/");
        const data = res.data?.resources ?? res.data?.data ?? res.data ?? [];
        if (mounted) setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch resources", err);
        toast.error?.("Failed to load resources");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchResources();
    return () => (mounted = false);
  }, []);

  const filtered = useFiltered(resources, {
    search,
    type: typeFilter,
    department: deptFilter,
  });

  const types = useMemo(() => {
    const set = new Set(resources.map((r) => r.type).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [resources]);

  const departments = useMemo(() => {
    const set = new Set(resources.map((r) => r.department).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [resources]);

  return (
    <div className="min-h-screen">
      <PageTitle
        title="Browse Resources"
        subtitle="Explore and request shared resources."
      />

      {/* Filters */}
      <div className="mb-5">
        {isSmallScreen ? (
          <div className="flex justify-between items-center">
            <div className="relative flex-1 mr-3">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Input
                className="pl-10"
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 space-y-4">
                <Label className="text-xs text-gray-500 mb-1 block">Type</Label>
                <Select onValueChange={setTypeFilter} value={typeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === "all" ? "All Types" : t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="text-xs text-gray-500 mb-1 block">
                  Department
                </Label>
                <Select onValueChange={setDeptFilter} value={deptFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d === "all" ? "All Departments" : d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setDeptFilter("all");
                  }}
                >
                  <XCircle className="w-4 h-4" /> Clear Filters
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Input
                className="pl-10"
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select onValueChange={setTypeFilter} value={typeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "all" ? "All Types" : t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setDeptFilter} value={deptFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d === "all" ? "All Departments" : d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setDeptFilter("all");
                }}
              >
                <XCircle className="w-4 h-4" /> Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Info className="w-4 h-4 animate-pulse" /> Loading resources...
            </span>
          ) : (
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {filtered.length}
              </span>{" "}
              of {resources.length} total
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400">Click cards to learn more</div>
      </div>

      <Separator className="mb-4" />

      {/* Grid */}
      <div>
        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-50 rounded-2xl p-4 h-36"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <ResourceCard key={r._id} resource={r} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No resources found.
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ resource }) {
  const navigate = useNavigate();
  const statusKey = (resource.status || "disabled").toLowerCase();
  const statusClass = STATUS_STYLES[statusKey] || STATUS_STYLES.disabled;

  const firstImage = resource.images?.[0];
  const availabilitySummary = resource.availability?.[0]
    ? `${resource.availability[0].day}: ${resource.availability[0].startTime} - ${resource.availability[0].endTime}`
    : "Flexible";

  return (
    <div
      className={`group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition ${statusClass}`}
    >
      {firstImage ? (
        <img
          src={firstImage}
          alt={resource.name}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-400">
          <ImageIcon className="w-8 h-8" />
        </div>
      )}

      <div className="p-4 space-y-2">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-800 truncate">
              {resource.name}
            </h3>

            <div className="text-xs px-2 py-1 rounded-md border bg-white capitalize">
              {resource.department}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-xs" variant="secondary">
                {resource.type}
              </Badge>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {resource.location}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">
          {resource.description}
        </p>

        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {availabilitySummary}
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" /> Capacity: {resource.capacity ?? 1}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <ShieldCheck className="w-3 h-3" />{" "}
          {resource.requiresApproval ? "Approval required" : "Auto-approved"}
        </div>

        <div className="mt-3 flex justify-between items-center text-sm">
          <span className="inline-flex items-center gap-1 text-blue-700">
            <CalendarClock className="w-4 h-4" /> Max{" "}
            {resource.maxBookingDuration || 1} hrs
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigate(`/resources/${resource._id}`);
            }}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
