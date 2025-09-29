import express from "express";
import { createServer } from "http";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

app.use("/api/v1/auth", authRoutes);

export default httpServer;
