import express from "express";
import {
  createNotification,
  getRecentNotifications,
  markAllRead,
  clearNotifications,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createNotification);
router.get("/recent", getRecentNotifications);
router.patch("/mark-all-read", markAllRead);
router.delete("/clear", clearNotifications);

export default router;
