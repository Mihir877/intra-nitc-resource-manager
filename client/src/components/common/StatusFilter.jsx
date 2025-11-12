import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// Themed status colors (light + dark compatible)
const STATUS_STYLES = {
  all: "bg-muted text-foreground dark:bg-muted dark:text-foreground",
  pending:
    "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100",
  approved:
    "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100",
  completed: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100",
  rejected: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100",
};

export function StatusFilter({ value, onChange, options, stats, labels }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="shrink-0 border-border text-foreground hover:bg-accent hover:text-accent-foreground "
        >
          <Filter className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Filters</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-56 bg-popover text-popover-foreground border-border shadow-md"
      >
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Status
          </div>
          <div className="space-y-1.5">
            {options.map((status) => (
              <button
                key={status}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer ",
                  value === status
                    ? STATUS_STYLES[status]
                    : "hover:bg-accent hover:text-accent-foreground text-foreground"
                )}
                onClick={() => onChange(status)}
              >
                <span>{labels[status]}</span>
                <Badge
                  variant={value === status ? "secondary" : "outline"}
                  className={cn(
                    "ml-2 border-border",
                    value === status && "bg-muted text-foreground"
                  )}
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
