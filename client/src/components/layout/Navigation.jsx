import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  Calendar,
  History,
  Settings,
  Users,
  Plus,
  FileCheck,
} from "lucide-react";

const studentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Server, label: "Browse Resources", href: "/resources" },
  { icon: Calendar, label: "My Requests", href: "/requests" },
  { icon: History, label: "Usage History", href: "/history" },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Server, label: "Manage Resources", href: "/admin/resources" },
  { icon: FileCheck, label: "Pending Requests", href: "/admin/requests" },
  { icon: Calendar, label: "Schedule", href: "/admin/schedule" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export function Navigation() {
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
  };
  const location = useLocation();
  const navItems = user?.role === "admin" ? adminNavItems : studentNavItems;

  return (
    <nav className="px-2 pt-1">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#2b4e9d] bg-primary/75 text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {user?.role !== "admin" && (
        <div className="pt-3 px-2">
          <Link
            to="/request"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Request Resource
          </Link>
        </div>
      )}
    </nav>
  );
}
