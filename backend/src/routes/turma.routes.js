import { Router } from "express";
import {
    listTurmas,
    getTurmaById,
    createTurma,
    updateTurma,
    updateTurmaStatus,
    deleteTurma,
} from "../controllers/turma.controller.js";

const router = Router();

router.get("/", listTurmas);
router.get("/:id", getTurmaById);
router.post("/", createTurma);
router.put("/:id", updateTurma);
router.patch("/:id/status", updateTurmaStatus);
router.delete("/:id", deleteTurma);

export default router;