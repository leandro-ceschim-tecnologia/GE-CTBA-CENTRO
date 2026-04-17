import { Router } from "express";
import {
    createTurmaDisciplina,
    deleteTurmaDisciplina,
    listTurmaDisciplinas,
    moverTurmaDisciplina,
    replicarInstrutorPadraoNasAulas,
    setInstrutorPadraoTurmaDisciplina,
    syncTurmaDisciplinas,
    updateTurmaDisciplina,
} from "../controllers/turmaDisciplina.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listTurmaDisciplinas);

router.post("/", requireAuth, requireRole("admin"), createTurmaDisciplina);

router.post(
    "/sync",
    requireAuth,
    requireRole("admin", "pedagogico"),
    syncTurmaDisciplinas
);

router.put(
    "/:id",
    requireAuth,
    requireRole("admin", "pedagogico"),
    updateTurmaDisciplina
);

router.patch(
    "/:id/mover",
    requireAuth,
    requireRole("admin", "pedagogico"),
    moverTurmaDisciplina
);

router.patch(
    "/:id/instrutor-padrao",
    requireAuth,
    requireRole("admin", "pedagogico"),
    setInstrutorPadraoTurmaDisciplina
);

router.patch(
    "/:id/replicar-instrutor",
    requireAuth,
    requireRole("admin", "pedagogico"),
    replicarInstrutorPadraoNasAulas
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin", "pedagogico"),
    deleteTurmaDisciplina
);

export default router;