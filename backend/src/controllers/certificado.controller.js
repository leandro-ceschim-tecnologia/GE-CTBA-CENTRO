import { emitirCertificadoLoteSchema } from "../schemas/certificado.schemas.js";
import * as certificadoService from "../services/certificado.service.js";

export async function emitirCertificadoIndividual(req, res, next) {
    try {
        const ofertaId = Number(req.params.id);
        const inscricaoId = Number(req.params.inscricaoId);

        const result = await certificadoService.emitirCertificadoIndividual(
            ofertaId,
            inscricaoId
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function regenerarCertificadoIndividual(req, res, next) {
    try {
        const ofertaId = Number(req.params.id);
        const inscricaoId = Number(req.params.inscricaoId);

        const result = await certificadoService.regenerarCertificadoIndividual(
            ofertaId,
            inscricaoId
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function emitirCertificadosPresentes(req, res, next) {
    try {
        const ofertaId = Number(req.params.id);
        const { sobrescrever } = emitirCertificadoLoteSchema.parse(req.body || {});

        const result = await certificadoService.emitirCertificadosPresentes(
            ofertaId,
            sobrescrever
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function regenerarCertificadosPresentes(req, res, next) {
    try {
        const ofertaId = Number(req.params.id);

        const result = await certificadoService.regenerarCertificadosPresentes(ofertaId);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function validarCertificadoPublico(req, res, next) {
    try {
        const codigo = req.params.codigo;
        const result = await certificadoService.buscarCertificadoPublicoPorCodigo(codigo);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getCertificadoDownload(req, res, next) {
    try {
        const ofertaId = Number(req.params.id);
        const inscricaoId = Number(req.params.inscricaoId);

        const result = await certificadoService.obterCertificadoParaDownload(
            ofertaId,
            inscricaoId,
            req.user
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}