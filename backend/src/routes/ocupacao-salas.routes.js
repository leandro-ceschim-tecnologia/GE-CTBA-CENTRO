import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { getOcupacaoSalasPorData } from "../controllers/ocupacao-salas.controller.js";

const router = Router();

router.get(
    "/",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    getOcupacaoSalasPorData
);

export default router;