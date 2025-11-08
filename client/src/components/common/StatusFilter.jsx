import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  all: "bg-gray-100 text-gray-900",
  pending: "bg-yellow-100 text-yellow-900",
  approved: "bg-green-100 text-green-900",
  completed: "bg-blue-100 text-blue-900",
  rejected: "bg-red-100 text-red-900"
};

export function StatusFilter({ value, onChange, options, stats, labels }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <Filter className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Filters</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500">Status</div>
          <div className="space-y-1.5">
            {options.map((status) => (
              <button
                key={status}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer",
                  value === status 
                    ? STATUS_STYLES[status]
                    : "hover:bg-gray-50 text-gray-700"
                )}
                onClick={() => onChange(status)}
              >
                <span>{labels[status]}</span>
                <Badge 
                  variant={value === status ? "secondary" : "outline"} 
                  className="ml-2"
                >
                  {stats[status]}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}