import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { verificarDisponibilidadeOferta } from "../controllers/oferta-disponibilidade.controller.js";

const router = Router();

router.post(
    "/",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    verificarDisponibilidadeOferta
);

export default router;