import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    emitirCertificadoIndividual,
    regenerarCertificadoIndividual,
    emitirCertificadosPresentes,
    regenerarCertificadosPresentes,
    validarCertificadoPublico,
    getCertificadoDownload,
} from "../controllers/certificado.controller.js";

const router = Router();

router.post(
    "/ofertas/:id/inscricoes/:inscricaoId/certificado",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    emitirCertificadoIndividual
);

router.post(
    "/ofertas/:id/inscricoes/:inscricaoId/certificado/regenerar",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    regenerarCertificadoIndividual
);

router.post(
    "/ofertas/:id/certificados/emitir-presentes",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    emitirCertificadosPresentes
);

router.post(
    "/ofertas/:id/certificados/regenerar-presentes",
    requireAuth,
    requireRole("admin", "pedagogico", "coordenacao"),
    regenerarCertificadosPresentes
);

router.get(
    "/ofertas/:id/inscricoes/:inscricaoId/certificado",
    requireAuth,
    getCertificadoDownload
);

router.get(
    "/certificados/publico/:codigo",
    validarCertificadoPublico
);

export default router;