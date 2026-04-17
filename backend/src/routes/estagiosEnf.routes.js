import { Router } from "express";
import {
    addAlunoToGrupo,
    addCampoToBloco,
    createBloco,
    createCampo,
    createGrupo,
    deleteBloco,
    deleteGrupo,
    getBlocoById,
    listAlunosDisponiveisPorBloco,
    listAlunosDoGrupo,
    listBlocos,
    listBlocosPadrao,
    listCampos,
    listCamposDoBloco,
    listGruposDoBloco,
    removeAlunoFromGrupo,
    removeCampoFromBloco,
    updateBloco,
    updateGrupo,
    getGrupoById,
    deleteRotacoesDoBloco,
    gerarRodizioAutomatico,
    listRotacoesDoBloco,
    getMeuEstagio,
    listSupervisoresCampo,
} from "../controllers/estagiosEnf.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get(
    "/blocos-padrao",
    requireRole("admin", "pedagogico", "coordenacao"),
    listBlocosPadrao
);

router.get(
    "/campos",
    requireRole("admin", "pedagogico", "coordenacao"),
    listCampos
);

router.post(
    "/campos",
    requireRole("admin", "pedagogico", "coordenacao"),
    createCampo
);

router.get(
    "/blocos",
    requireRole("admin", "pedagogico", "coordenacao"),
    listBlocos
);

router.post(
    "/blocos",
    requireRole("admin", "pedagogico", "coordenacao"),
    createBloco
);

router.get(
    "/blocos/:id",
    requireRole("admin", "pedagogico", "coordenacao"),
    getBlocoById
);

router.put(
    "/blocos/:id",
    requireRole("admin", "pedagogico", "coordenacao"),
    updateBloco
);

router.delete(
    "/blocos/:id",
    requireRole("admin", "pedagogico", "coordenacao"),
    deleteBloco
);

router.get(
    "/blocos/:id/campos",
    requireRole("admin", "pedagogico", "coordenacao"),
    listCamposDoBloco
);

router.post(
    "/blocos/:id/campos",
    requireRole("admin", "pedagogico", "coordenacao"),
    addCampoToBloco
);

router.delete(
    "/blocos/:id/campos/:campoVinculoId",
    requireRole("admin", "pedagogico", "coordenacao"),
    removeCampoFromBloco
);

router.get(
    "/blocos/:id/grupos",
    requireRole("admin", "pedagogico", "coordenacao"),
    listGruposDoBloco
);

router.post(
    "/blocos/:id/grupos",
    requireRole("admin", "pedagogico", "coordenacao"),
    createGrupo
);

router.get(
    "/blocos/:id/alunos-disponiveis",
    requireRole("admin", "pedagogico", "coordenacao"),
    listAlunosDisponiveisPorBloco
);

router.get(
    "/grupos/:grupoId",
    requireRole("admin", "pedagogico", "coordenacao"),
    getGrupoById
);

router.put(
    "/grupos/:grupoId",
    requireRole("admin", "pedagogico", "coordenacao"),
    updateGrupo
);

router.delete(
    "/grupos/:grupoId",
    requireRole("admin", "pedagogico", "coordenacao"),
    deleteGrupo
);

router.get(
    "/grupos/:grupoId/alunos",
    requireRole("admin", "pedagogico", "coordenacao"),
    listAlunosDoGrupo
);

router.post(
    "/grupos/:grupoId/alunos",
    requireRole("admin", "pedagogico", "coordenacao"),
    addAlunoToGrupo
);

router.delete(
    "/grupos/:grupoId/alunos/:alunoId",
    requireRole("admin", "pedagogico", "coordenacao"),
    removeAlunoFromGrupo
);

router.get(
    "/blocos/:id/rotacoes",
    requireRole("admin", "pedagogico", "coordenacao"),
    listRotacoesDoBloco
);

router.post(
    "/blocos/:id/rotacoes/gerar-automatico",
    requireRole("admin", "pedagogico", "coordenacao"),
    gerarRodizioAutomatico
);

router.delete(
    "/blocos/:id/rotacoes",
    requireRole("admin", "pedagogico", "coordenacao"),
    deleteRotacoesDoBloco
);

router.get(
    "/meu-estagio",
    requireRole("aluno"),
    getMeuEstagio
);

router.get(
    "/supervisores",
    requireRole("admin", "pedagogico", "coordenacao"),
    listSupervisoresCampo
);

export default router;