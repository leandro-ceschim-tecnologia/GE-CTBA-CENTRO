import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    createReserva,
    listMinhasReservasInstrutor,
    updateReservaStatus,
} from "../controllers/reserva.controller.js";

const router = Router();

router.post(
    "/",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "instrutor"),
    createReserva
);

router.patch(
    "/:id/status",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "instrutor"),
    updateReservaStatus
);

router.get(
    "/minhas",
    requireAuth,
    requireRole("instrutor", "admin", "pedagogico", "coordenacao"),
    listMinhasReservasInstrutor
);

export default router;