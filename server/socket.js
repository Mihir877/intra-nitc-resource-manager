import { Server } from "socket.io";

const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // console.log("🟢 User connected:", socket.id);

    socket.on("register", (userId) => {
      onlineUsers.set(userId, socket.id);
      // console.log(`✅ Registered user ${userId} with socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
      for (const [userId, id] of onlineUsers) {
        if (id === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      // console.log("🔴 User disconnected:", socket.id);
    });
  });

  return { io, onlineUsers };
};
