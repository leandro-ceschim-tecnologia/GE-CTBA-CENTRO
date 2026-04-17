import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    listEnsalamentos,
    getEnsalamentoById,
    createEnsalamento,
    createEnsalamentoLote,
    updateEnsalamento,
    deleteEnsalamento,
    getMeuEnsalamento,
} from "../controllers/ensalamento.controller.js";

const router = Router();

router.get(
    "/",
    requireAuth,
    listEnsalamentos
);

router.get(
    "/meu",
    requireAuth,
    getMeuEnsalamento
);

router.get(
    "/:id",
    requireAuth,
    getEnsalamentoById
);

router.post(
    "/",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    createEnsalamento
);

router.post(
    "/lote",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    createEnsalamentoLote
);

router.put(
    "/:id",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    updateEnsalamento
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    deleteEnsalamento
);

export default router;