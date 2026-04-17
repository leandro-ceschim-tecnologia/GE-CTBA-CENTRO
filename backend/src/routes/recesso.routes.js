import { Router } from "express";
import {
    createRecesso,
    importRecessos,
    listRecessos,
    updateRecesso,
    updateRecessoStatus,
} from "../controllers/recesso.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listRecessos);
router.post("/", requireAuth, requireRole("admin"), createRecesso);
router.post("/importar", requireAuth, requireRole("admin"), importRecessos);
router.put("/:id", requireAuth, requireRole("admin"), updateRecesso);
router.patch("/:id/status", requireAuth, requireRole("admin"), updateRecessoStatus);

export default router;