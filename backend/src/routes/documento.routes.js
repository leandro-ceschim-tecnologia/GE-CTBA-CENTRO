import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    emitirDocumento,
    regenerarDocumento,
    listarDocumentos,
    buscarDocumento,
    getDocumentoDownload,
    cancelarDocumento,
    validarDocumentoPublico,
    listarMeusDocumentos,
    listarTemplatesDocumento,
} from "../controllers/documento.controller.js";

const router = Router();

/**
 * Emissão administrativa
 */

router.get(
    "/documentos/templates",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "secretaria"),
    listarTemplatesDocumento
);

router.post(
    "/documentos",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "secretaria"),
    emitirDocumento
);

router.post(
    "/documentos/:id/regenerar",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "secretaria"),
    regenerarDocumento
);

router.get(
    "/documentos",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "secretaria"),
    listarDocumentos
);

router.get(
    "/documentos/:id",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "secretaria"),
    buscarDocumento
);

router.get(
    "/documentos/:id/download",
    requireAuth,
    getDocumentoDownload
);

router.patch(
    "/documentos/:id/cancelar",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao", "secretaria"),
    cancelarDocumento
);

/**
 * Área do aluno/usuário vinculado
 */
router.get(
    "/meus-documentos",
    requireAuth,
    listarMeusDocumentos
);

/**
 * Validação pública
 */
router.get(
    "/documentos/publico/validar/:codigo",
    validarDocumentoPublico
);

export default router;