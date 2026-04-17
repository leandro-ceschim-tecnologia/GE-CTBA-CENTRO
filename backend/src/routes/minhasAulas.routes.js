import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    getMinhasAulasAluno,
    getMinhasAulasInstrutor,
} from "../controllers/minhasAulas.controller.js";

const router = Router();

router.get(
    "/instrutor",
    requireAuth,
    requireRole("instrutor", "coordenacao", "admin", "pedagogico"),
    getMinhasAulasInstrutor
);

router.get(
    "/aluno",
    requireAuth,
    requireRole("aluno", "admin", "pedagogico", "coordenacao"),
    getMinhasAulasAluno
);

export default router;