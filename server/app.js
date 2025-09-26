import express from "express";
import { createServer } from "http";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

export default httpServer;
