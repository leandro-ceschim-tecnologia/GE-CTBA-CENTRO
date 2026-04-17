import { Router } from "express";
import {
    buscarGradeFrequencia,
    buscarHistoricoAluno,
    criarLancamentoFrequencia,
    listarFiltrosFrequencia,
    vincularAlunoNaDisciplina,
} from "../controllers/frequencia.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
    "/filtros",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria", "instrutor"),
    listarFiltrosFrequencia
);

router.get(
    "/grade",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria", "instrutor"),
    buscarGradeFrequencia
);

router.post(
    "/lancamento",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria", "instrutor"),
    criarLancamentoFrequencia
);

router.post(
    "/adicionar-aluno",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    vincularAlunoNaDisciplina
);

router.get(
    "/aluno/:alunoId/historico",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria", "instrutor"),
    buscarHistoricoAluno
);

export default router;