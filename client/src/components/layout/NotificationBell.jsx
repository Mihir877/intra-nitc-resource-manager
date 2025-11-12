import React, { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { io } from "socket.io-client";
import { notify } from "@/lib/notify";
import api from "@/api/axios";

export default function NotificationBell({
  userId,
  onItemClick, // (n) => void
  onViewAll, // () => void
}) {
  const [notifs, setNotifs] = useState([]);

  const unreadCount = useMemo(
    () => notifs.filter((n) => !n.read).length,
    [notifs]
  );

  useEffect(() => {
    if (!userId) return;

    // Fetch recent notifications
    api.get("/notifications/recent?limit=20").then((res) => {
      if (res.data.success) setNotifs(res.data.notifications);
    });

    const socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:8080", {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("register", userId.toString());
    });

    const onNotification = (payload) => {
      const { title, message, type = "info" } = payload || {};
      const map = {
        success: notify.success,
        error: notify.error,
        warning: notify.warning,
        info: notify.info,
      };
      (map[type] ?? notify.info)(title ?? "Notification", message ?? "");

      // Prepend new notification
      setNotifs((prev) => [
        {
          ...payload,
          read: false,
          createdAt: payload?.createdAt ?? new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    socket.on("notification", onNotification);

    return () => {
      socket.off("notification", onNotification);
      socket.disconnect();
    };
  }, [userId]);

  // Do NOT auto-clear unread count when opening the dropdown
  const handleOpenChange = (open) => {
    if (open) {
      // just show notifications — do NOT mark read
      // This allows badge count to remain visible until "Clear all"
    }
  };

  // Mark all as read and clear badge
  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/mark-all-read");
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      await handleMarkAllAsRead();
      setNotifs([]); // clear the list
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const empty = notifs.length === 0;

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-[3px] rounded-full bg-yellow-400 text-[10px] text-yellow-950 flex items-center justify-center">
              <span className="pt-px">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-3 py-2">
          Notifications {unreadCount > 0 ? `(${unreadCount} new)` : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-auto">
          {empty ? (
            <div className="px-3 py-6 text-sm text-muted-foreground text-center">
              You're all caught up
            </div>
          ) : (
            notifs.slice(0, 20).map((n, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted/60 ${
                  !n.read ? "bg-muted/40" : ""
                }`}
                onClick={() => {
                  if (onItemClick) onItemClick(n);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium truncate">
                    {n.title ?? "Notification"}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                {n.message && (
                  <div className="text-muted-foreground text-xs mt-0.5 line-clamp-3">
                    {n.message}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {!empty && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive/90"
              >
                Clear all
              </Button>
              <Button variant="outline" size="sm" onClick={onViewAll}>
                View all
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
