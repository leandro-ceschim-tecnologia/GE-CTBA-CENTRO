import { Router } from "express";
import {
    gerarCronograma,
    getCronogramaByTurma,
    regenerarCronograma,
} from "../controllers/cronograma.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/gerar", requireAuth, requireRole("admin"), gerarCronograma);
router.post(
    "/regenerar",
    requireAuth,
    requireRole("admin", "pedagogico"),
    regenerarCronograma
);
router.get("/turma/:turmaId", requireAuth, getCronogramaByTurma);

export default router;