import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  approved: {
    base: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    hover: "hover:bg-green-200 dark:hover:bg-green-800/50",
  },
  pending: {
    base: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    hover: "hover:bg-yellow-200 dark:hover:bg-yellow-800/50",
  },
  rejected: {
    base: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    hover: "hover:bg-red-200 dark:hover:bg-red-800/50",
  },
  available: {
    base: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    hover: "hover:bg-green-200 dark:hover:bg-green-800/50",
  },
  "in use": {
    base: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    hover: "hover:bg-orange-200 dark:hover:bg-orange-800/50",
  },
  maintenance: {
    base: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    hover: "hover:bg-yellow-200 dark:hover:bg-yellow-800/50",
  },
  disabled: {
    base: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700",
    hover: "hover:bg-gray-200 dark:hover:bg-gray-700/60",
  },
};

export default function StatusBadge({ status, className = "", onClick }) {
  const key = String(status || "disabled").toLowerCase();
  const color = STATUS_COLORS[key] || STATUS_COLORS.disabled;

  const isClickable = typeof onClick === "function";

  return (
    <Badge
      onClick={onClick}
      variant="outline"
      className={`border ${color.base} ${
        color.hover
      } capitalize font-medium text-xs px-2.5 py-1 rounded-md  duration-150 ${
        isClickable ? "cursor-pointer" : "cursor-default"
      } ${className}`}
    >
      {status || "—"}
    </Badge>
  );
}
