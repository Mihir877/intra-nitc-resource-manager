import httpServer from "./app.js";
import connectDB from "./db.js";
import { initSocket } from "./socket.js";

const startServer = () => {
  const PORT = process.env.PORT || 8080;

  // Initialize Socket.IO
  const { io, onlineUsers } = initSocket(httpServer);

  // Expose globally to use it in controllers
  global._io = io;
  global._onlineUsers = onlineUsers;

  httpServer.listen(PORT, () => {
    console.log(`⚙️  Server running on port: ${PORT}`);
  });
};

try {
  await connectDB();
  startServer();
} catch (error) {
  console.error("❌ MongoDB connection error:", error);
}
