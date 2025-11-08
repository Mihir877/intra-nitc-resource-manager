import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

  return (
    <>
      {/* ✅ Large screens (card layout with icons) */}
      {(layout === "grid" || layout === "responsive") && (
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {stats.map((item) => (
            <Card key={item.label} className="">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {item.label}
                </CardTitle>
                <span className="w-5 h-5 flex items-center justify-center text-gray-500">
                  {item.icon}
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {item.value}
                </div>
                {item.subtitle && (
                  <div className="text-xs text-gray-500">{item.subtitle}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ✅ Small screens (compact layout, smaller icons) */}
      {(layout === "compact" || layout === "responsive") && (
        <div className="sm:hidden space-y-2 mb-5 bg-white p-3 rounded-lg shadow border">
          {stats.map((item, index) => (
            <React.Fragment key={item.label}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {/* 🔹 Smaller icon here */}
                  <span className="text-gray-500 w-4 h-4 mr-0.5 flex items-center justify-center">
                    {item.icon &&
                      React.cloneElement(item.icon, {
                        className:
                          (item.icon.props.className || "")
                      })}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">
                    {item.label}
                  </span>
                </div>
                <span className="font-semibold text-gray-900 text-sm">
                  {item.value}
                </span>
              </div>
              {index !== stats.length - 1 && <Separator className="my-1.5" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
}
