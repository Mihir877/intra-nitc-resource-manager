import React, { useState } from "react";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/hooks/useSidebar";
import useAuth from "@/hooks/useAuth";
import NotificationBell from "@/components/layout/NotificationBell";
import ThemeToggle from "../common/ThemeToggle";
import NITCLogo from "../common/NITCLogo";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setOpen } = useSidebar();

  // 👇 NEW: dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-sidebar text-sidebar-foreground backdrop-blur">
      <div className="flex h-14 items-center px-3 md:px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <NITCLogo />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell
            userId={user?._id}
            onItemClick={(n) => {
              if (n.relatedRequestId) {
                navigate(`/requests/${n.relatedRequestId}`);
              }
            }}
            onViewAll={() => navigate("/notifications")}
          />

          {/* 👇 Control the open state */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <div
                variant="ghost"
                className="flex items-center rounded-full gap-2"
              >
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.username
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">
                  {user?.username}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize font-medium">
                  {user?.role}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    user.role === "admin" ? "/admin/profile/me" : "/profile/me"
                  )
                }
              >
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>

              {/* 👇 Pass setDropdownOpen down */}
              <DropdownMenuItem asChild>
                <ThemeToggle />
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
