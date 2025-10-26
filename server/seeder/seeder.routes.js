// routes/seeder.routes.js
import { Router } from "express";
import {
  seedUsersFromJson,
  seedResourcesFaker,
  seedRequestsRandom,
  seedDecisionsRandom,
} from "./seeder.controller.js";
import { requireAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.use(requireAdmin);

// All endpoints are admin-only
router.post("/users", seedUsersFromJson);
router.post("/resources", seedResourcesFaker);
router.post("/requests", seedRequestsRandom);
router.post("/decisions", seedDecisionsRandom);

export default router;
