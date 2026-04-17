import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

import {
    createOferta,
    listOfertas,
    getOferta,
    updateOferta,
    updateStatus,
    inscrever,
    listInscricoes,
    updateInscricao,
    listOfertasDisponiveisMe,
    listMinhasInscricoes,
    listMinhasOfertasInstrutor,
} from "../controllers/oferta.controller.js";

const router = Router();

// ADMIN / PEDAGOGICO / COORDENACAO
router.post(
    "/",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    createOferta
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    updateOferta
);

router.patch(
    "/:id/status",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    updateStatus
);

router.get(
    "/:id/inscricoes",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    listInscricoes
);

router.patch(
    "/:id/inscricoes/:inscricaoId",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    updateInscricao
);

router.get("/disponiveis/me", requireAuth, listOfertasDisponiveisMe);
router.get("/minhas-inscricoes/me", requireAuth, listMinhasInscricoes);

router.get(
    "/minhas-ofertas/instrutor",
    requireAuth,
    requireRole("instrutor"),
    listMinhasOfertasInstrutor
);

// GERAL
router.get("/", requireAuth, listOfertas);
router.get("/:id", requireAuth, getOferta);

// INSCRIÇÃO
router.post("/:id/inscrever", requireAuth, inscrever);

export default router;