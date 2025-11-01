import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
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
  User,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

const studentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Server, label: "Browse Resources", href: "/resources" },
  { icon: Calendar, label: "My Requests", href: "/requests" },
  { icon: History, label: "History", href: "/history" },
  { icon: Calendar, label: "Schedule", href: "/schedule" },
  { icon: User, label: "Profile", href: "/profile" },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Server, label: "Manage Resources", href: "/admin/resources" },
  { icon: FileCheck, label: "Pending Requests", href: "/admin/requests" },
  { icon: Calendar, label: "Schedule", href: "/admin/schedule" },
  { icon: Users, label: "Users", href: "/admin/users" },
  // { icon: Settings, label: "Preferences", href: "/admin/preferences" },
];

export function Navigation() {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = user?.role === "admin" ? adminNavItems : studentNavItems;

  return (
    <nav className="p-3">
      <ul className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");

          return (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-chart-3 text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate -mt-1px">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* {user?.role !== "admin" && (
        <div className="pt-5">
          <Link
            to="/request"
            className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-primary/85 px-3 py-2.5 text-sm text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            <span className="-mt-[1px]">Request Resource</span>
          </Link>
        </div>
      )} */}
    </nav>
  );
}
