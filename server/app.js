import express from "express";
import { createServer } from "http";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

app.use("/public", express.static("public"));

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// Importing route modules

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import requestRoutes from "./routes/request.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// ❌ Developer only routes ❌
import seederRoutes from "./seeder/seeder.routes.js";
app.use("/api/v1/seeder", seederRoutes);

export default httpServer;
