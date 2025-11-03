// hooks/useNotificationsSocket.jsx
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { notify } from "@/lib/notify"; // adjust path to your notify.js [attached_file:5]

export default function useNotificationsSocket(user) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;

    // Initialize socket
    const socket = io(
      import.meta.env.VITE_SERVER_BASE_URI ?? "http://localhost:8080",
      {
        withCredentials: true,
        transports: ["websocket"],
      }
    );

    socketRef.current = socket;

    // Register the userId so server can map socket <-> user
    socket.on("connect", () => {
      socket.emit("register", user._id.toString());
    });

    // Handle incoming notifications
    const onNotification = (payload) => {
      const { title, message, type = "info" } = payload || {};
      const map = {
        success: notify.success,
        error: notify.error,
        warning: notify.warning,
        info: notify.info,
      };
      (map[type] ?? notify.info)(title ?? "Notification", message ?? ""); // [attached_file:5]
    };

    socket.on("notification", onNotification);

    // Optional: handle disconnects/errors
    socket.on("disconnect", () => {
      // silent or show a toast if needed
    });
    socket.on("connect_error", () => {
      // silent or show a toast if needed
    });

    return () => {
      socket.off("notification", onNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  return socketRef.current;
}
