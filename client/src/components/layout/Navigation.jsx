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
    <nav className="w-64 bg-card border-r min-h-screen p-4">
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {user?.role !== "admin" && (
          <Link
            to="/request-resource"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors mt-4"
          >
            <Plus className="h-4 w-4" />
            <span>Request Resource</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
