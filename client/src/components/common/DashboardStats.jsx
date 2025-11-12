import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * DashboardStats Component
 * Shared between Admin and Student dashboards
 *
 * Props:
 * - stats: [{ label, value, subtitle?, icon? }]
 * - layout: 'responsive' | 'grid' | 'compact'
 */
export default function DashboardStats({ stats = [], layout = "responsive" }) {
  if (!stats?.length) return null;

  // 🧩 Dynamically compute the grid columns based on number of stats
  const gridCols =
    stats.length === 1
      ? "grid-cols-1"
      : stats.length === 2
      ? "grid-cols-2"
      : stats.length === 3
      ? "grid-cols-3"
      : stats.length === 4
      ? "grid-cols-4"
      : stats.length === 5
      ? "grid-cols-5"
      : "grid-cols-6"; // default for >5

  return (
    <>
      {/* Large screens (dynamic grid layout) */}
      {(layout === "grid" || layout === "responsive") && (
        <div
          className={cn(
            "hidden sm:grid gap-4 mb-5",
            gridCols // 👈 dynamic grid
          )}
        >
          {stats.map((item) => (
            <Card
              key={item.label}
              className="bg-card text-card-foreground border-border  "
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                  {item.icon}
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {item.value}
                </div>
                {item.subtitle && (
                  <div className="text-xs text-muted-foreground">
                    {item.subtitle}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Small screens (compact stacked layout) */}
      {(layout === "compact" || layout === "responsive") && (
        <div className="sm:hidden space-y-2 mb-5 bg-card text-card-foreground p-3 rounded-lg shadow border border-border  ">
          {stats.map((item, index) => (
            <React.Fragment key={item.label}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-4 h-4 mr-0.5 flex items-center justify-center">
                    {item.icon &&
                      React.cloneElement(item.icon, {
                        className: cn(
                          item.icon.props.className,
                          "text-muted-foreground"
                        ),
                      })}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <span className="font-semibold text-foreground text-sm">
                  {item.value}
                </span>
              </div>
              {index !== stats.length - 1 && (
                <Separator className="my-1.5 bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
}
