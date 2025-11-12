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
  // { icon: History, label: "History", href: "/history" },
  { icon: Calendar, label: "Schedule", href: "/schedule" },
  { icon: User, label: "Profile", href: "/profile/me" },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Server, label: "Manage Resources", href: "/admin/resources" },
  { icon: FileCheck, label: "Pending Requests", href: "/admin/requests" },
  // { icon: Calendar, label: "Schedule", href: "/admin/schedule" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: User, label: "Profile", href: "/admin/profile/me" },
  // { icon: Settings, label: "Preferences", href: "/admin/preferences" },
];

export function Navigation({ setOpen }) {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = user?.role === "admin" ? adminNavItems : studentNavItems;

  const handleClose = () => {
    if (setOpen) {
      setOpen(false);
    }
  };

  return (
    <nav className="p-3">
      <ul className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");

          return (
            <li key={item.href} onClick={handleClose}>
              <NavLink
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm  duration-200",
                  isActive
                    ? // 🔹 Active link styling (theme-aware)
                      "bg-primary text-primary-foreground shadow-sm"
                    : // 🔹 Default link styling
                      "text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
