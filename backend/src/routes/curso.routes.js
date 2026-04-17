import { Router } from "express";
import { createCurso, listCursos, updateCurso, updateCursoStatus } from "../controllers/curso.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listCursos);
router.post("/", requireAuth, requireRole("admin"), createCurso);
router.put("/:id", requireAuth, requireRole("admin"), updateCurso);
router.patch("/:id/status", requireAuth, requireRole("admin"), updateCursoStatus);

export default router;