import { Router } from "express";
import { createDisciplina, listDisciplinas, updateDisciplina, updateDisciplinaStatus } from "../controllers/disciplina.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listDisciplinas);
router.post("/", requireAuth, requireRole("admin"), createDisciplina);
router.put("/:id", requireAuth, requireRole("admin"), updateDisciplina);
router.patch("/:id/status", requireAuth, requireRole("admin"), updateDisciplinaStatus);

export default router;