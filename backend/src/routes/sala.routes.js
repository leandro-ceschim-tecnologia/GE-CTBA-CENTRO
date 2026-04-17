import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    listSalas,
    getSalaById,
    createSala,
    updateSala,
    updateSalaStatus,
    deleteSala,
} from "../controllers/sala.controller.js";

const router = Router();

router.get(
    "/",
    requireAuth,
    listSalas
);

router.get(
    "/:id",
    requireAuth,
    getSalaById
);

router.post(
    "/",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    createSala
);

router.put(
    "/:id",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    updateSala
);

router.patch(
    "/:id/status",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    updateSalaStatus
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    deleteSala
);

export default router;