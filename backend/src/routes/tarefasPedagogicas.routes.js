import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    listTarefasPedagogicas,
    getResumoTarefasPedagogicas,
    getTarefaPedagogicaById,
    listPedagogicosAtivos,
    validarSugestaoPrazoLevantamentoCH,
    createTarefaPedagogica,
    createTarefasPedagogicasEmLote,
    updateStatusTarefaPedagogica,
    deleteTarefaPedagogica,
} from "../controllers/tarefasPedagogicas.controller.js";

const router = Router();

// Apoio ao formulário / seletores
router.get(
    "/tarefas-pedagogicas/pedagogicos",
    requireAuth,
    requireRole("admin", "pedagogico"),
    listPedagogicosAtivos
);

router.get(
    "/tarefas-pedagogicas/resumo",
    requireAuth,
    requireRole("admin", "pedagogico"),
    getResumoTarefasPedagogicas
);

router.post(
    "/tarefas-pedagogicas/validar-levantamento-ch",
    requireAuth,
    requireRole("admin", "pedagogico"),
    validarSugestaoPrazoLevantamentoCH
);

// CRUD / listagem
router.get(
    "/tarefas-pedagogicas",
    requireAuth,
    requireRole("admin", "pedagogico"),
    listTarefasPedagogicas
);

router.post(
    "/tarefas-pedagogicas",
    requireAuth,
    requireRole("admin", "pedagogico"),
    createTarefaPedagogica
);

router.post(
    "/tarefas-pedagogicas/lote",
    requireAuth,
    requireRole("admin", "pedagogico"),
    createTarefasPedagogicasEmLote
);

router.get(
    "/tarefas-pedagogicas/:id",
    requireAuth,
    requireRole("admin", "pedagogico"),
    getTarefaPedagogicaById
);

router.patch(
    "/tarefas-pedagogicas/:id/status",
    requireAuth,
    requireRole("admin", "pedagogico"),
    updateStatusTarefaPedagogica
);

router.delete(
    "/tarefas-pedagogicas/:id",
    requireAuth,
    requireRole("admin"),
    deleteTarefaPedagogica
);

export default router;