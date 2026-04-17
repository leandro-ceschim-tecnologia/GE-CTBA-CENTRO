import { Router } from "express";
import { listInstrutores } from "../controllers/instrutor.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin", "pedagogico", "coordenacao"), listInstrutores);

export default router;