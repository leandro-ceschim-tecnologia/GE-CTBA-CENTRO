import { Router } from "express";
import {
    buscarHistoricoAluno,
    cancelarOcorrencia,
    finalizarOcorrencia,
    listarOcorrencias,
    marcarComoLancadoSistema,
    processarAluno,
    processarAula,
    registrarTratativa,
} from "../controllers/evasao.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
    "/ocorrencias",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    listarOcorrencias
);

router.post(
    "/processar/aluno",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    processarAluno
);

router.post(
    "/processar/aula",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    processarAula
);

router.post(
    "/tratativa",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    registrarTratativa
);

router.post(
    "/lancado-sistema",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    marcarComoLancadoSistema
);

router.post(
    "/finalizar",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    finalizarOcorrencia
);

router.post(
    "/cancelar",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    cancelarOcorrencia
);

router.get(
    "/aluno/:alunoId/historico",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"),
    buscarHistoricoAluno
);

export default router;