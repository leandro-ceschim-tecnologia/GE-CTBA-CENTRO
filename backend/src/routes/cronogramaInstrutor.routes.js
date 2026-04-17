import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { setInstrutorAPartirDaAula, setInstrutorNaAula } from "../controllers/cronogramaInstrutor.controller.js";
import { updateCronogramaAula } from "../controllers/cronogramaAula.controller.js";


const router = Router();

router.patch(
    "/:aulaId/instrutor",
    requireAuth,
    requireRole("admin", "pedagogico"),
    setInstrutorNaAula
);

router.patch(
    "/:aulaId/instrutor-a-partir",
    requireAuth,
    requireRole("admin", "pedagogico"),
    setInstrutorAPartirDaAula
);

router.patch(
    "/:aulaId",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    updateCronogramaAula
);

export default router;