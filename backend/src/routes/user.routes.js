import { Router } from "express";
import {
    createUser,
    deleteUser,
    importUsers,
    listUsers,
    updateUser,
    updateUserStatus,
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { listPublicUsers } from "../controllers/user.controller.js";

const router = Router();
router.get(
    "/usuarios-publicos",
    requireAuth,
    requireRole(
        "admin",
        "direcao",
        "pedagogico",
        "coordenacao",
        "coordsetor",
        "comercial",
        "secretaria",
        "instrutor",
        "aluno",
        "supervisor"
    ),
    listPublicUsers
);
router.get("/", requireAuth, requireRole("admin", "pedagogico", "coordenacao", "secretaria"), listUsers);
router.post("/", requireAuth, requireRole("admin"), createUser);
router.post("/importar", requireAuth, requireRole("admin"), importUsers);
router.put("/:id", requireAuth, requireRole("admin"), updateUser);
router.patch("/:id/status", requireAuth, requireRole("admin"), updateUserStatus);
router.delete("/:id", requireAuth, requireRole("admin"), deleteUser);
router.get("/usuarios-publicos", requireAuth, listPublicUsers);

export default router;

