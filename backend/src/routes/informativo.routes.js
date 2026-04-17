import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    createInformativo,
    listInformativosAdmin,
    getInformativoById,
    updateInformativo,
    updateInformativoStatus,
    listInformativosAtivosMe,
    listDestinatariosInformativos,
} from "../controllers/informativo.controller.js";

const router = Router();

// Administração do módulo
router.get(
    "/informativos",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor"),
    listInformativosAdmin
);

router.post(
    "/informativos",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor"),
    createInformativo
);

router.get(
    "/informativos/destinatarios",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor"),
    listDestinatariosInformativos
);

router.get(
    "/informativos/:id",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor"),
    getInformativoById
);

router.put(
    "/informativos/:id",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor"),
    updateInformativo
);

router.patch(
    "/informativos/:id/status",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor"),
    updateInformativoStatus
);

// Informativos ativos do usuário logado
router.get(
    "/informativos/me/ativos",
    requireAuth,
    listInformativosAtivosMe
);

export default router;